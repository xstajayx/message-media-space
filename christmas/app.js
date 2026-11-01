import {RELEASE,GAME_TYPES,validateContent,unlocked,londonDate,load,save,profile,award,total,randomInt} from './core.js?v=2026.3';
import {audio,toggle,effect} from './audio.js?v=2026.3';
const $=id=>document.getElementById(id);let c,data=load(localStorage),demo=false,cleanup=()=>{},generation=0,openedBy;const dialog=$('surprise'),root=$('activity');const current=()=>data.profiles.find(p=>p.id===data.active)||data.profiles[0];function persist(){try{save(localStorage,data)}catch{$('offline').textContent='Storage is unavailable or full. Progress will last only for this visit.'}renderStats()}
function feedback(text){$('feedback').textContent=text}function el(tag,text,parent=root,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n}function btn(text,fn,parent=root){const b=el('button',text,parent);b.type='button';b.onclick=()=>{effect();fn(b)};return b}
function renderStats(){const p=current();$('stats').textContent=`⭐ ${total(p)} stars · ${p.opened.length} / 24 doors · ${Object.keys(p.awards).filter(x=>x.startsWith('game:')).length} activities completed`;$('leaderboard').replaceChildren();[...data.profiles].sort((a,b)=>total(b)-total(a)).forEach(p=>{el('p',`${p.avatar} ${p.name} · ${total(p)} stars`,$('leaderboard'));const scores=Object.entries(p.scores);if(scores.length)el('p',scores.map(([k,v])=>`${k.replace('game:','Day ')}: ${v}`).join(' · '),$('leaderboard'),'small')});$('profiles').replaceChildren();data.profiles.forEach(p=>{const o=el('option',`${p.avatar} ${p.name}`,$('profiles'));o.value=p.id;o.selected=p.id===data.active})}
function renderDoors(){const p=current();$('doors').replaceChildren();c.days.forEach(d=>{const open=p.opened.includes(d.day),available=unlocked(d.day,c.year);const b=el('button',undefined,$('doors'),`door ${open?'opened':available?'available':'locked'}`);el('span',String(d.day),b,'number');el('span',open?'✓ Revisit':available?'✦ Open me':'♧ Locked',b,'state');b.setAttribute('aria-label',`December ${d.day}: ${open?'opened, revisit':available?'available':'locked'}`);b.onclick=()=>{effect('door');if(!available){openDialog('A little patience, a little magic',`December ${d.day}`,false);el('p',`This door opens on ${d.day} December ${c.year} at midnight, Europe/London. Earlier doors stay available.`);return}b.classList.add('reveal');p.opened=[...new Set([...p.opened,d.day])];award(p,`door:${d.day}`,1);persist();openDay(d,false);renderDoors()}});const now=new Date(),date=londonDate(now);$('countdown').textContent=date.year<c.year||(date.year===c.year&&date.month<12)?`${Math.max(0,Math.ceil((Date.UTC(c.year,11,1)-now)/86400000))} sleeps until the village opens · 1 December ${c.year}`:date.year>c.year||date.day>=25?'Merry Christmas — every Advent door is ready to revisit.':`It’s ${date.day} December · your Christmas magic is ready`;$('finale').textContent=unlocked(25,c.year)?'🎁 Enter the Christmas Day celebration':'🎁 Opens 25 December';}
function openDialog(title,label,isDemo){cleanup();cleanup=()=>{};generation++;demo=isDemo;openedBy=document.activeElement;root.replaceChildren();feedback('');$('surpriseTitle').textContent=title;$('dayLabel').textContent=(demo?'SEPARATE DEMO · NO FAMILY AWARDS · ':'')+label;if(!dialog.open)dialog.showModal();$('close').focus()}
function close(){generation++;cleanup();cleanup=()=>{};dialog.close();openedBy?.focus()}
$('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
async function openDay(d,isDemo){openDialog(d.title,`DECEMBER ${d.day}`,isDemo);const token=generation,p=current();const complete=(score,stars)=>{if(demo){effect('success');return}award(p,`game:${d.day}`,stars,score);persist();effect('success')};el('p',d.message);if(GAME_TYPES.includes(d.type)){el('p','Unwrapping your activity…');try{const {mount}=await import(`./games/index.js?v=${RELEASE}`);if(token!==generation)return;root.replaceChildren();el('p',d.message,root,'daily-message');const gameRoot=el('div',undefined,root,'game-content');cleanup=mount(gameRoot,d.type,c,{demo,feedback,complete,cue:effect,bestScore:p.scores[`game:${d.day}`]||0,design:()=>demo?[]:structuredClone(p.design),saveDesign:v=>{if(!demo){p.design=structuredClone(v);persist()}}})}catch{if(token===generation){root.replaceChildren();el('p','The activity could not load. Reconnect and try again.')}}return}
const celebration=(title,message)=>{const box=el('div',undefined,root,'celebration');el('div','🛷 ✨ 🎄',box,'hero-emoji');el('h3',title,box);el('p',message,box);btn('Replay the magic',()=>{box.classList.remove('reveal');requestAnimationFrame(()=>box.classList.add('reveal'));effect('success')},box)};
switch(d.type){case'cracker':el('div','🎉 ━ 🎁 ━ 🎉',root,'celebration');btn('Pull the cracker!',()=>{feedback(c.jokes[randomInt(c.jokes.length)]);complete(1,1)});break;case'letter':btn('✉ Break the golden seal',b=>{b.remove();el('div',d.message+' You make our family brighter. Thank you for the kindness, laughter and wonderful little things you bring to every day.',root,'letter');complete(1,1)});break;case'recipe':el('h3','Cinnamon star biscuits');el('p','Makes about 20 · 25 minutes plus cooling. Ask an adult to help with the oven. Contains wheat and dairy; check ingredients for allergies.');el('h4','Ingredients');const ingredients=el('ul');['150 g plain flour','75 g softened butter','50 g caster sugar','1 tsp cinnamon','1–2 tbsp milk'].forEach(t=>el('li',t,ingredients));el('h4','Bake together');const steps=el('ol');['Heat oven to 180°C (160°C fan). Line a baking tray.','Cream butter and sugar. Stir in flour and cinnamon; add milk gradually to form a dough.','Roll to 5 mm thick, cut stars and place on the tray.','Bake for 12–15 minutes until lightly golden. Cool before decorating.'].forEach(t=>el('li',t,steps));btn('We baked together',b=>{b.disabled=true;complete(1,2);feedback('Star bakers! Two stars for a lovely family moment.')});break;case'kindness':{let task;const output=el('h3');const choose=()=>{task=c.kindness[randomInt(c.kindness.length)];output.textContent=task};choose();btn('Choose another act of kindness',choose);btn('I completed this kindness',b=>{b.disabled=true;complete(1,1);feedback('A little kindness makes a big difference. Your star is saved.')});break}case'code':el('h3',c.code.clue);const label=el('label','Decoded word');const input=el('input',undefined,label);const check=btn('Check the secret code',b=>{if(input.value.trim().toUpperCase()===c.code.answer.trim().toUpperCase()){b.disabled=true;complete(1,2);feedback('The secret is yours! A snowy Christmas wish for everyone.')}else feedback('Not quite — match each number to its letter and try again.')});input.onkeydown=e=>{if(e.key==='Enter')check.click()};break;case'box':el('div','🎁',root,'celebration');btn('Unwrap the mystery',b=>{b.remove();el('h3','Tonight’s mission: a family Christmas time capsule');el('p','Each person writes one happy memory and one wish for next year. Put them in an envelope and save it for next December.');btn('Our time capsule is ready',b=>{b.disabled=true;complete(1,2);feedback('A little piece of this Christmas, saved for the next one.')})});break;case'eve':celebration('The sleigh is on its way',d.message+' Set out a little kindness, get cosy, and dream of Christmas morning.');const countdown=el('p');const update=()=>{const ms=Math.max(0,Date.UTC(c.year,11,25)-Date.now());countdown.textContent=ms?`${Math.floor(ms/3600000)} hours · ${Math.floor(ms/60000)%60} minutes until Christmas Day in London`:'Christmas Day is here!'};update();const timer=setInterval(update,1000);cleanup=()=>clearInterval(timer);break;}
}
$('preview').onclick=()=>{openDialog('A little peek at Christmas','DEMO VILLAGE',true);el('p','Try any activity in a separate demonstration. Nothing here opens a calendar door or earns family stars.');c.days.forEach(d=>btn(`${d.day} · ${d.title}`,()=>openDay(d,true)));btn('Reset demonstration',()=>{$('preview').click()})};$('finale').onclick=()=>{if(!unlocked(25,c.year)){openDialog('A present worth waiting for','CHRISTMAS DAY',false);el('p',`Our Christmas Day celebration opens on 25 December ${c.year}, Europe/London.`);return}openDialog('MERRY CHRISTMAS!','25 DECEMBER',false);const box=el('div',undefined,root,'celebration');el('div','🎅 🛷 ✨ 🎁 🎄',box,'hero-emoji');el('h3','MERRY CHRISTMAS!',box);el('p',c.greeting,box);btn('Replay Christmas magic',()=>{effect('success');box.classList.remove('reveal');requestAnimationFrame(()=>box.classList.add('reveal'))});btn('Christmas party game · Toy Factory',()=>openDay({day:25,title:'Christmas Party at the Toy Factory',type:'factory',message:c.greeting},false))};
$('profiles').onchange=e=>{data.active=e.target.value;persist();renderDoors()};$('addProfile').onclick=()=>{$('profileDialog').showModal();$('profileForm').elements.name.focus()};$('cancelProfile').onclick=()=>$('profileDialog').close();$('profileForm').onsubmit=e=>{e.preventDefault();const f=e.target,name=f.elements.name.value.trim();if(!name)return;if(data.profiles.length>=12){feedback('This browser supports up to 12 profiles.');$('profileDialog').close();return}const p=profile(name,f.elements.avatar.value);data.profiles.push(p);data.active=p.id;persist();renderDoors();$('profileDialog').close();f.reset()};
for(const kind of ['music','effects']){const b=$(kind==='music'?'music':'sound');b.textContent=`${kind==='music'?'♫ Music':'♪ Effects'} ${audio[kind]?'on (tap to start)':'off'}`;b.onclick=()=>{const on=toggle(kind);b.textContent=`${kind==='music'?'♫ Music':'♪ Effects'} ${on?'on':'off'}`;b.setAttribute('aria-pressed',String(on))};b.setAttribute('aria-pressed',String(audio[kind]))}
$('motion').onclick=()=>{const paused=document.body.classList.toggle('paused');$('motion').textContent=paused?'Resume motion':'Pause motion';$('motion').setAttribute('aria-pressed',String(paused))};
// Older cached HTML predates these controls; create them when a fresh script
// is loaded into that shell rather than throwing before startup can recover.
for (const [id, tag, text] of [
  ['retryLoad', 'button', 'Retry loading the village'],
  ['loadDetails', 'p', '']
]) {
  if (!$(id)) {
    const control = document.createElement(tag);
    control.id = id;
    control.textContent = text;
    control.hidden = true;
    if (id === 'loadDetails') control.className = 'small';
    $('countdown').insertAdjacentElement('afterend', control);
  }
}
// Register independently of content loading, so a failed launch cannot prevent updates.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
}
let refreshTimer;
async function startCalendar() {
  $('preview').disabled = $('finale').disabled = true;
  $('retryLoad').hidden = true;
  $('loadDetails').hidden = true;
  $('countdown').textContent = 'Lighting the village…';
  try {
    // A release-specific URL prevents a fresh config being paired with old validators.
    const response = await fetch(`content.json?v=${RELEASE}`, { cache: 'reload' });
    if (!response.ok) throw Error(`Content request returned HTTP ${response.status}`);
    c = validateContent(await response.json());
    $('year').textContent = c.year;
    renderStats();
    renderDoors();
    clearInterval(refreshTimer);
    refreshTimer = setInterval(renderDoors, 30000);
    $('preview').disabled = $('finale').disabled = false;
  } catch (error) {
    console.error('Christmas calendar startup failed:', error);
    $('countdown').textContent = 'The village could not load. Please try again.';
    $('retryLoad').hidden = false;
    $('loadDetails').textContent = `Loading details: ${error.message}`;
    $('loadDetails').hidden = false;
  }
}
$('retryLoad').onclick = startCalendar;
document.addEventListener('visibilitychange', () => { if (!document.hidden && c) renderDoors(); });
await startCalendar();

function connection(){$('offline').textContent=navigator.onLine?'Progress stays on this device.':'Offline: cached activities may work. New content needs connectivity; dates use this device’s clock.'}window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
