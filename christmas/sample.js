// A standalone pre-December game. It imports no daily content or game router.
import {shuffled} from './core.js?v=2026.5';
import {createGame} from './games/engine.js?v=2026.5';

export function mountSample(root,api){
  let game;
  const start=()=>{
    game?.dispose();root.replaceChildren();api.feedback('');game=createGame(root,api);
    const g=game;
    g.title('JUST A LITTLE WINTER MAGIC','Fill your own snow globe','Five little sparkles, one tiny winter world. This sample is separate from every Advent door. It never changes your family’s stars or progress.');
    const label=g.el('label','Choose your sparkle style'),mode=g.el('select',undefined,label);
    const gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(const [value,text]of[['timing','Sparkle catcher — stop the needle in the golden band'],['gentle','Gentle sparkle — match the symbol, with no timer']]){const o=g.el('option',text,mode);o.value=value;o.selected=(value==='gentle')===gentle;}
    const begin=g.button('Shake the snow globe',()=>{const gentle=mode.value==='gentle';label.remove();begin.remove();play(gentle);},root,'gold');
    function play(gentle){
      g.playing();let attempts=0,hits=0,score=0,elapsed=0,last=0,finished=false,locked=false,paused=false;
      const [sparkles,points,round]=g.hud(['Sparkles','Sample score','Turn']);
      const globe=g.el('div',undefined,root,'sample-globe');globe.setAttribute('role','img');
      g.el('div','❄',globe,'globe-snow');g.el('div','🏡',globe,'globe-cottage');
      const stars=g.el('div','',globe,'globe-stars');
      const instruction=g.el('p','',root,'sample-instruction');instruction.setAttribute('role','status');
      const arena=g.el('div',undefined,root,gentle?'sample-symbols':'sparkle-meter');
      const controls=g.el('div',undefined,root,'game-controls');
      const symbols=['✦','❄','☾','◆','✿'];
      let needle,choices=[],capture,target=0,order=[0,1,2,3,4];
      const draw=()=>{sparkles.textContent=`${hits} / 5`;points.textContent=score;round.textContent=`${Math.min(5,attempts+1)} / 5`;stars.textContent='✦ '.repeat(hits);globe.setAttribute('aria-label',`Snow globe with ${hits} sparkles`);};
      const next=()=>{
        if(finished)return;
        if(gentle){
          target=(attempts*3+1)%symbols.length;order=shuffled(order);instruction.textContent=`Find this sparkle: ${symbols[target]}`;choices.forEach((b,i)=>{b.textContent=symbols[order[i]];b.disabled=paused;});
        }else instruction.textContent='Catch the sparkle when the needle is inside the golden band.';
        locked=false;draw();
      };
      const answer=(right,precision=1)=>{
        if(finished||locked||paused)return;locked=true;attempts++;
        if(right){hits++;score+=Math.round(50+precision*50);api.cue?.('success');api.feedback('A little sparkle, caught!');}else api.feedback(gentle?'A different shape! Your next sparkle is waiting.':'Just outside the band! There’s another sparkle to catch.');
        draw();
        if(attempts===5){
          finished=true;choices.forEach(b=>b.disabled=true);if(capture)capture.disabled=true;pause.disabled=true;
          const panel=g.result({score,stars:0,heading:hits?'A little world of winter magic!':'A fresh little snowfall awaits',detail:`You caught ${hits} of 5 sparkles. Your 24 Advent surprises stay a secret until December.`,restart:start});
          g.el('p','Sample only — no doors opened, no family stars awarded.',panel,'small');api.feedback('Your calendar progress is unchanged.');return;
        }
        if(gentle)choices.forEach(b=>b.disabled=true);
        g.later(next,450);
      };
      if(gentle){
        choices=symbols.map((symbol,i)=>g.button(symbol,()=>{if(!locked)answer(order[i]===target);},arena));
      }else{
        const band=g.el('div',undefined,arena,'sparkle-band');band.setAttribute('aria-hidden','true');
        needle=g.el('div',undefined,arena,'sparkle-needle');needle.setAttribute('aria-hidden','true');
        capture=g.button('Catch the sparkle · Space',()=>{const x=(Math.sin(elapsed*2.4)+1)/2;answer(x>=.36&&x<=.64,Math.max(0,1-Math.abs(x-.5)/.14));},controls,'gold');
        g.el('p','The middle golden band is the target. Prefer no moving needle? Choose Gentle sparkle on the start screen.',root,'small');
      }
      const pause=g.button('Pause',()=>{paused=!paused;pause.textContent=paused?'Resume':'Pause';choices.forEach(b=>b.disabled=paused||locked);if(capture)capture.disabled=paused;},controls);
      g.listen(root,'keydown',event=>{if(!finished&&!gentle&&event.key===' '&&!event.repeat&&event.target!==pause){event.preventDefault();capture.click();}});
      const tick=now=>{if(finished)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(!paused&&!document.hidden){elapsed+=dt;if(needle)needle.style.left=`${(Math.sin(elapsed*2.4)+1)*50}%`;}g.frame(tick);};
      next();if(!gentle)g.frame(tick);
    }
  };
  start();return()=>game?.dispose();
}
