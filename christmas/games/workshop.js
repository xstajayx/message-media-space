import { createGame } from './engine.js?v=2026.4';
import { randomInt, shuffled } from '../core.js?v=2026.4';
import { svgNode, searchArt, SEARCH_ITEMS, plainTree, treeWidth } from './workshop-art.js?v=2026.4';

export function signalState(tiles) {
  const visited=new Set(), queue=tiles[0].includes(3)?[0]:[];
  while(queue.length) {
    const index=queue.shift(); if(visited.has(index))continue;visited.add(index);
    for(const direction of tiles[index]) {
      const row=Math.floor(index/3),col=index%3;
      const [dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][direction];
      const r=row+dr,c=col+dc;
      if(r<0||r>2||c<0||c>2)continue;
      const next=r*3+c;
      if(tiles[next].includes((direction+2)%4))queue.push(next);
    }
  }
  return {visited,connected:visited.size===9&&tiles[8].includes(1)};
}
const SIGNAL_SOLUTION=[[3,1],[3,1],[3,2],[1,2],[1,3],[0,3],[0,1],[3,1],[3,1]];

export function mountWorkshop(root,type,c,api) {
  let game;
  const start=()=>{game?.dispose();root.replaceChildren();api.feedback('');game=createGame(root,api);if(type==='tree')decorate(game);if(type==='find')search(game);if(type==='letter')signal(game);};

  function decorate(g) {
    g.title('YOUR VERY OWN EVERGREEN','A blank tree. A little imagination.','Start with a plain evergreen and make it yours. Choose an ornament, then tap a branch. Tap a decoration to remove it. Your tree is saved on this profile.');
    let selected='🔴';
    const allowed=['🔴','🔵','🟡','⭐','🎀','🔔','💡','❄️','🎁'];
    const history=[];
    let design=api.design().filter(o=>o&&[...allowed,'❄'].includes(o.s)&&Number.isFinite(o.x)&&Number.isFinite(o.y)).slice(0,60).map(o=>{
      const y=Math.max(12,Math.min(86,o.y)),width=Math.max(1,treeWidth(y)-1);
      return {s:o.s==='❄'?'❄️':o.s,x:Math.max(50-width,Math.min(50+width,o.x)),y};
    });
    const palette=g.el('div',undefined,root,'ornament-palette');
    const labels=['Ruby bauble','Blue bauble','Golden bauble','Star','Ribbon','Bell','Fairy light','Snowflake','Present'];
    const picks=allowed.map((symbol,i)=>{const b=g.button(symbol,()=>{selected=symbol;picks.forEach((button,k)=>button.setAttribute('aria-pressed',String(k===i)));},palette);b.setAttribute('aria-label',`Select ${labels[i]}`);b.setAttribute('aria-pressed',String(i===0));return b;});
    const stage=g.el('div',undefined,root,'decorate-stage');stage.tabIndex=0;stage.append(plainTree());
    stage.setAttribute('aria-label','Tree canvas. Tap branches to add ornaments, or use the position menu below.');
    const status=g.el('p','',root,'small');
    const commit=()=>{api.saveDesign(structuredClone(design));draw();};
    const snapshot=()=>{history.push(structuredClone(design));if(history.length>30)history.shift();};
    const draw=()=>{
      stage.querySelectorAll('.tree-ornament').forEach(n=>n.remove());
      design.forEach((ornament,i)=>{
        const b=g.button(ornament.s,()=>{snapshot();design.splice(i,1);commit();api.feedback('Decoration removed. Undo brings it back.');stage.focus();},stage,'tree-ornament');
        b.style.left=`${ornament.x}%`;b.style.top=`${ornament.y}%`;
        b.setAttribute('aria-label',`Remove ${labels[allowed.indexOf(ornament.s)]} decoration ${i+1}`);
      });
      status.textContent=design.length?`${design.length} of 60 decorations · Your design saves here as you go.`:'A completely plain tree — you add every sparkle.';
      undo.disabled=!history.length;
    };
    const place=(x,y)=>{
      if(design.length>=60){api.feedback('Your tree is full! Remove an ornament or clear the tree.');return;}
      if(y<6||y>87||Math.abs(x-50)>treeWidth(y)){api.feedback('Choose a green branch so the ornament hangs on the tree.');return;}
      snapshot();design.push({s:selected,x,y});commit();api.cue?.('button');api.feedback(`${labels[allowed.indexOf(selected)]} added.`);
    };
    g.listen(stage,'click',event=>{
      if(event.target.closest('.tree-ornament'))return;
      const rect=stage.getBoundingClientRect();place((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
    });
    const positionLabel=g.el('label','Keyboard placement');
    const position=g.el('select',undefined,positionLabel);position.setAttribute('aria-label','Decoration position');
    [['Treetop',50,11],['Upper branches',50,29],['Middle left',39,50],['Middle right',61,50],['Lower left',29,77],['Lower right',71,77]].forEach(([name,x,y])=>{const option=g.el('option',name,position);option.value=`${x},${y}`;});
    g.button('Add at selected position',()=>place(...position.value.split(',').map(Number)));
    const controls=g.el('div',undefined,root,'game-controls');
    const undo=g.button('Undo',()=>{if(history.length){design=history.pop();commit();api.feedback('Last change undone.');}},controls);
    g.button('Add fairy lights',()=>{
      if(design.length>50){api.feedback('Leave space for ten fairy lights first.');return;}
      snapshot();[[45,28],[53,33],[42,44],[50,48],[59,53],[34,66],[44,69],[55,73],[65,78],[49,82]].forEach(([x,y])=>design.push({s:'💡',x,y}));commit();api.feedback('Ten fairy lights, placed by you.');
    },controls);
    g.button('Clear tree',()=>{snapshot();design=[];commit();api.feedback('Back to a completely plain tree. Undo restores your design.');},controls);
    g.button('Save finished tree',()=>{
      if(design.length<3){api.feedback('Add at least three decorations to finish your tree.');return;}
      api.complete(design.length,2);api.cue?.('success');api.feedback(`Wonderful! Your ${design.length}-decoration Christmas tree is saved. You can keep decorating.`);
    },controls,'gold');
    draw();
  }

  function search(g) {
    g.title('THE GREAT SANTA SEARCH','Look closely. Christmas is full of lookalikes.','Explore three busy corners of the village. Each has four hidden details to find among 24 lookalikes. Read the clues: the right hat, ribbon or scarf matters! Wrong guesses and hints reduce your score.');
    const label=g.el('label','Search style'),mode=g.el('select',undefined,label);
    for(const [value,text]of[['detective','Detective — no timer'],['blizzard','Blizzard — 120 seconds for all three scenes']]){const o=g.el('option',text,mode);o.value=value;}
    const begin=g.button('Search the village',()=>{const timed=mode.value==='blizzard';label.remove();begin.remove();play(timed);},root,'gold');
    function play(timed) {
      g.playing();let round=0,found=0,mistakes=0,hints=0,elapsed=0,last=0,finished=false,paused=false;
      const names=['Lantern Square','Snowy Forest','Santa’s Workshop'];
      const [progress,points,clock]=g.hud(['Found','Score',timed?'Time':'Scene']);
      const meter=g.meter('Search progress',12);
      const heading=g.el('h3','',root,'search-heading');
      const clueList=g.el('ul',undefined,root,'search-clues');
      const board=g.el('div',undefined,root,'santa-search-scene');
      const controls=g.el('div',undefined,root,'game-controls');
      let targets=[],buttons=[],hinted=new Set();
      const score=()=>Math.max(0,found*25-mistakes*5-hints*15);
      const update=()=>{progress.textContent=`${found} / 12`;points.textContent=score();clock.textContent=timed?`${Math.max(0,Math.ceil(120-elapsed))}s`:`${round+1} / 3`;meter.value=found;};
      const finish=won=>{if(finished)return;finished=true;buttons.forEach(b=>b.disabled=true);hint.disabled=pause.disabled=zoom.disabled=true;g.result({score:score(),heading:won?'An eagle-eyed Christmas detective!':'The blizzard rolled in!',detail:won?'Every little clue solved, across all three scenes. Santa is impressed.':'Try Detective mode to search without a clock.',stats:[`${found} details found · ${mistakes} wrong guesses · ${hints} hints`],restart:start});};
      const drawScene=()=>{
        board.replaceChildren();clueList.replaceChildren();hinted=new Set();heading.textContent=names[round];board.className=`santa-search-scene scene-${round}`;zoom.textContent='Zoom view';zoom.setAttribute('aria-pressed','false');
        const layer=g.el('div',undefined,board,'search-layer');
        const backdrop=g.el('div',undefined,layer,'search-backdrop');backdrop.setAttribute('aria-hidden','true');
        for(const symbol of ['🏠','🌲','🏘️','🌲','🛷','🏠'])g.el('span',symbol,backdrop);
        targets=['santa','present','bell','snowman'].map((kind,i)=>({kind,variant:kind==='snowman'?[3,0,2][round]:(round+i)%6,found:false}));
        targets.forEach(target=>{const item=g.el('li',SEARCH_ITEMS[target.kind][target.variant],clueList);item.dataset.kind=target.kind;});
        const deck=shuffled(Object.keys(SEARCH_ITEMS).flatMap(kind=>Array.from({length:6},(_,variant)=>({kind,variant}))));
        buttons=deck.map((object,i)=>{
          const b=g.button('',()=>{
            if(paused||finished||b.disabled)return;
            const target=targets.find(t=>t.kind===object.kind&&t.variant===object.variant&&!t.found);
            if(!target){mistakes++;api.feedback('A lookalike! Check the little details in the clues. −5');update();return;}
            target.found=true;found++;b.disabled=true;b.classList.add('object-found');b.setAttribute('aria-label',`Found: ${SEARCH_ITEMS[object.kind][object.variant]}`);
            clueList.querySelector(`[data-kind="${object.kind}"]`).classList.add('clue-found');api.feedback(`Found ${SEARCH_ITEMS[object.kind][object.variant]}! +25`);api.cue?.('success');update();
            if(targets.every(t=>t.found)){hint.disabled=true;if(round===2)finish(true);else{next.hidden=false;next.focus();}}
          },layer,'search-object');
          b.append(searchArt(object.kind,object.variant));b.setAttribute('aria-label',SEARCH_ITEMS[object.kind][object.variant]);
          b.style.left=`${8.3+(i%6)*16.65+(randomInt(3)-1)}%`;b.style.top=`${20+Math.floor(i/6)*21+(randomInt(5)-2)}%`;
          b.style.transform=`translate(-50%,-50%) rotate(${randomInt(13)-6}deg)`;
          return b;
        });
        next.hidden=true;hint.disabled=false;update();
      };
      const hint=g.button('Spotlight a clue · −15',()=>{
        if(paused||finished)return;
        const remaining=targets.filter(t=>!t.found&&!hinted.has(t.kind));
        if(!remaining.length){api.feedback('You have already spotlighted the remaining clues in this scene.');return;}
        const target=remaining[randomInt(remaining.length)];hinted.add(target.kind);hints++;const b=buttons.find(b=>b.getAttribute('aria-label')===SEARCH_ITEMS[target.kind][target.variant]);b.classList.add('spotlight');b.scrollIntoView({block:'nearest',inline:'nearest'});g.later(()=>b.classList.remove('spotlight'),1400);api.feedback(`Watch for the golden spotlight: ${SEARCH_ITEMS[target.kind][target.variant]}.`);update();
      },controls);
      const zoom=g.button('Zoom view',()=>{const enlarged=board.classList.toggle('search-zoom');zoom.textContent=enlarged?'Zoom out':'Zoom view';zoom.setAttribute('aria-pressed',String(enlarged));api.feedback(enlarged?'Swipe or scroll inside the scene to inspect the bigger details.':'Full scene restored.');},controls);zoom.setAttribute('aria-pressed','false');
      const pause=g.button('Pause',()=>{paused=!paused;pause.textContent=paused?'Resume':'Pause';board.classList.toggle('game-paused',paused);buttons.forEach(b=>b.disabled=paused||b.classList.contains('object-found'));hint.disabled=paused||targets.every(t=>t.found);next.disabled=paused;},controls);
      const next=g.button('Next neighbourhood',()=>{if(paused||finished)return;round++;drawScene();heading.tabIndex=-1;heading.focus();},controls,'gold');
      drawScene();
      const tick=now=>{if(finished)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(!paused&&!document.hidden){elapsed+=dt;update();if(elapsed>=120){finish(false);return;}}g.frame(tick);};
      if(timed)g.frame(tick);buttons[0].focus();
    }
  }

  function signal(g) {
    g.title('AN URGENT TRANSMISSION FROM THE NORTH POLE','Santa’s secret signal','A snowstorm has scrambled the magic radio! Rotate the nine signal tiles until a single golden route connects the lantern at the top left to Santa’s receiver at the bottom right. Restore the signal to unlock your letter.');
    const begin=g.button('Restore Santa’s signal',()=>{begin.remove();play();},root,'gold');
    function play() {
      g.playing();let tiles=SIGNAL_SOLUTION.map(ports=>{const turns=1+randomInt(3);return ports.map(p=>(p+turns)%4);}),moves=0,hints=0,sending=false;
      const [strength,turns,assist]=g.hud(['Signal','Rotations','Hints']);
      const meter=g.meter('Signal strength',9);
      const label=g.el('p','LANTERN → connect all nine tiles → NORTH POLE',root,'signal-route');
      const board=g.el('div',undefined,root,'signal-board');
      const directions=['up','right','down','left'];
      const buttons=tiles.map((ports,i)=>g.button('',()=>{if(sending)return;tiles[i]=tiles[i].map(p=>(p+1)%4);moves++;draw();api.cue?.('button');},board,'signal-tile'));
      const draw=()=>{
        const state=signalState(tiles);strength.textContent=`${state.visited.size} / 9`;turns.textContent=moves;assist.textContent=hints;meter.value=state.visited.size;
        buttons.forEach((button,i)=>{
          button.replaceChildren();button.classList.toggle('powered',state.visited.has(i));
          const svg=svgNode('svg',{viewBox:'0 0 80 80','aria-hidden':'true'});button.append(svg);
          for(const p of tiles[i]){const [x,y]=[[40,0],[80,40],[40,80],[0,40]][p];svgNode('path',{d:`M40 40L${x} ${y}`,stroke:'currentColor','stroke-width':12,'stroke-linecap':'round',fill:'none'},svg);}
          svgNode('circle',{cx:40,cy:40,r:8,fill:'currentColor'},svg);
          button.setAttribute('aria-label',`Signal tile ${i+1}, openings ${tiles[i].map(p=>directions[p]).join(' and ')}. Rotate clockwise.`);
        });
        send.disabled=!state.connected||sending;label.textContent=state.connected?'Signal restored! Send it to Santa.':'LANTERN → connect all nine tiles → NORTH POLE';
      };
      const controls=g.el('div',undefined,root,'game-controls');
      const hint=g.button('Align one tile · −15',()=>{
        if(sending)return;
        const index=tiles.findIndex((ports,i)=>!SIGNAL_SOLUTION[i].every(p=>ports.includes(p)));
        if(index<0)return;tiles[index]=[...SIGNAL_SOLUTION[index]];hints++;draw();api.feedback(`Tile ${index+1} aligned. Follow its golden path.`);
      },controls);
      const send=g.button('Send the secret signal',()=>{
        if(sending||!signalState(tiles).connected)return;sending=true;send.disabled=hint.disabled=true;buttons.forEach(b=>b.disabled=true);
        label.textContent='✦ Sending through the northern lights…';board.classList.add('transmitting');api.cue?.('success');
        g.later(()=>{label.textContent='🛷 Signal received by Santa’s sleigh…';},900);
        g.later(()=>{
          const panel=g.result({score:Math.max(50,300-moves*3-hints*15),heading:'A letter, just for you!',detail:'Your signal reached the North Pole. The golden seal is opening…',stats:[`${moves} rotations · ${hints} assists`],restart:start});
          const letter=g.el('article',undefined,panel,'santa-letter');g.el('p',`Dear ${api.name||'Christmas explorer'},`,letter);g.el('p',c.santaMessage||c.greeting,letter);g.el('p','Keep your kindness bright. The most wonderful Christmas magic is the joy you share.',letter);g.el('p','With snowy wishes, Santa ✦',letter);api.cue?.('success');
        },2100);
      },controls,'gold');
      draw();buttons[0].focus();
    }
  }
  start();return()=>game?.dispose();
}
