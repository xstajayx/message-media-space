import {RELEASE,GAME_TYPES,validateContent,unlocked,londonDate,load,save,profile,award,total} from './core.js?v=2026.5';
import {audio,toggle,effect} from './audio.js?v=2026.5';
const $=id=>document.getElementById(id);let c,data=load(localStorage),cleanup=()=>{},generation=0,openedBy;const dialog=$('surprise'),root=$('activity');const current=()=>data.profiles.find(p=>p.id===data.active)||data.profiles[0];function persist(){try{save(localStorage,data)}catch{$('offline').textContent='Storage is unavailable or full. Progress will last only for this visit.'}renderStats()}
const oldPreview=$('preview');
if(oldPreview){oldPreview.id='sample';oldPreview.textContent='Play a little snow globe sample';oldPreview.hidden=true;oldPreview.disabled=true;}
function feedback(text){$('feedback').textContent=text}function el(tag,text,parent=root,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n}function btn(text,fn,parent=root){const b=el('button',text,parent);b.type='button';b.onclick=()=>{effect();fn(b)};return b}
function renderStats(){const p=current();$('stats').textContent=`⭐ ${total(p)} stars · ${p.opened.length} / 24 doors · ${Object.keys(p.awards).filter(x=>x.startsWith('game:')).length} activities completed`;$('leaderboard').replaceChildren();[...data.profiles].sort((a,b)=>total(b)-total(a)).forEach(p=>{el('p',`${p.avatar} ${p.name} · ${total(p)} stars`,$('leaderboard'));const scores=Object.entries(p.scores);if(scores.length)el('p',scores.map(([k,v])=>`${k.replace('game:','Day ')}: ${v}`).join(' · '),$('leaderboard'),'small')});$('profiles').replaceChildren();data.profiles.forEach(p=>{const o=el('option',`${p.avatar} ${p.name}`,$('profiles'));o.value=p.id;o.selected=p.id===data.active})}
function renderDoors(){const p=current();$('doors').replaceChildren();c.days.forEach(d=>{const open=p.opened.includes(d.day),available=unlocked(d.day,c.year);const b=el('button',undefined,$('doors'),`door ${open?'opened':available?'available':'locked'}`);el('span',String(d.day),b,'number');el('span',open?'✓ Revisit':available?'✦ Open me':'♧ Locked',b,'state');b.setAttribute('aria-label',`December ${d.day}: ${open?'opened, revisit':available?'available':'locked'}`);b.onclick=()=>{effect('door');if(!available){openDialog('A little patience, a little magic',`December ${d.day}`,false);el('p',`This door opens on ${d.day} December ${c.year} at midnight, Europe/London. Earlier doors stay available.`);return}b.classList.add('reveal');p.opened=[...new Set([...p.opened,d.day])];award(p,`door:${d.day}`,1);persist();openDay(d);renderDoors()}});const now=new Date(),date=londonDate(now);$('countdown').textContent=date.year<c.year||(date.year===c.year&&date.month<12)?`${Math.max(0,Math.ceil((Date.UTC(c.year,11,1)-now)/86400000))} sleeps until the village opens · 1 December ${c.year}`:date.year>c.year||date.day>=25?'Merry Christmas — every Advent door is ready to revisit.':`It’s ${date.day} December · your Christmas magic is ready`;$('sample').hidden=unlocked(1,c.year);$('finale').textContent=unlocked(25,c.year)?'🎁 Enter the Christmas Day celebration':'🎁 Opens 25 December';}
function openDialog(title,label,isDemo){cleanup();cleanup=()=>{};generation++;openedBy=document.activeElement;root.replaceChildren();root.setAttribute('aria-busy','false');feedback('');$('surpriseTitle').textContent=title;$('dayLabel').textContent=(isDemo?'SAMPLE GAME · NO FAMILY AWARDS · ':'')+label;if(!dialog.open)dialog.showModal();$('close').focus()}
function close(){generation++;cleanup();cleanup=()=>{};dialog.close();openedBy?.focus()}
$('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
async function openDay(d){
  if(!unlocked(d.day,c.year))return;
  openDialog(d.title,`DECEMBER ${d.day}`,false);
  const token=generation,p=current();
  const complete=(score,stars)=>{award(p,`game:${d.day}`,stars,score);persist();effect('success')};
  const api={demo:false,name:p.name,feedback,complete,cue:effect,bestScore:p.scores[`game:${d.day}`]||0,design:()=>structuredClone(p.design),saveDesign:v=>{p.design=structuredClone(v);persist()}};
  root.setAttribute('aria-busy','true');el('p','Unwrapping your activity…');
  try{
    if(GAME_TYPES.includes(d.type)){
      const {mount}=await import(`./games/index.js?v=${RELEASE}`);
      if(token!==generation)return;
      root.replaceChildren();el('p',d.message,root,'daily-message');
      cleanup=mount(el('div',undefined,root,'game-content'),d.type,c,api);
    }else{
      const {mountStory}=await import(`./stories.js?v=${RELEASE}`);
      if(token!==generation)return;
      root.replaceChildren();cleanup=mountStory(root,d,c,api);
    }
  }catch{
    if(token===generation){root.replaceChildren();el('p','The activity could not load. Reconnect and try again.')}
  }finally{if(token===generation)root.setAttribute('aria-busy','false')}
}

$('sample').onclick=async()=>{
  if(!c||unlocked(1,c.year))return;
  openDialog('A Little Snowglobe Magic','STANDALONE SAMPLE',true);
  const token=generation;root.setAttribute('aria-busy','true');el('p','Polishing the snow globe…');
  try{
    const {mountSample}=await import(`./sample.js?v=${RELEASE}`);
    if(token!==generation)return;
    root.replaceChildren();cleanup=mountSample(el('div',undefined,root,'game-content'),{demo:true,feedback,cue:effect,complete:()=>{}});
  }catch{if(token===generation){root.replaceChildren();el('p','The sample could not load. Please reconnect and try again.')}}
  finally{if(token===generation)root.setAttribute('aria-busy','false')}
};
$('finale').onclick=()=>{if(!unlocked(25,c.year)){openDialog('A present worth waiting for','CHRISTMAS DAY',false);el('p',`Our Christmas Day celebration opens on 25 December ${c.year}, Europe/London.`);return}openDialog('MERRY CHRISTMAS!','25 DECEMBER',false);const box=el('div',undefined,root,'celebration');el('div','🎅 🛷 ✨ 🎁 🎄',box,'hero-emoji');el('h3','MERRY CHRISTMAS!',box);el('p',c.greeting,box);btn('Replay Christmas magic',()=>{effect('success');box.classList.remove('reveal');requestAnimationFrame(()=>box.classList.add('reveal'))});btn('Christmas party game · Toy Factory',()=>openDay({day:25,title:'Christmas Party at the Toy Factory',type:'factory',message:c.greeting}))};
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
  $('sample').disabled = $('finale').disabled = true;
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
    $('sample').disabled = $('finale').disabled = false;
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
