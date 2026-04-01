const DATA_URL = './assets/data/brainrots.json';
const META_URL = './assets/data/brainrot-metadata.json';
const FILTER_KEY = 'mms_brainrot_filters_v1';

const rarityOrder = ['Common','Rare','Epic','Legendary','Mythic','Brainrot God','Secret','OG','Unknown'];

const el = {
  searchInput: document.getElementById('searchInput'),
  rarityFilter: document.getElementById('rarityFilter'),
  spawnFilter: document.getElementById('spawnFilter'),
  sortSelect: document.getElementById('sortSelect'),
  results: document.getElementById('results'),
  statusArea: document.getElementById('statusArea'),
  resultCount: document.getElementById('resultCount'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  detailModal: document.getElementById('detailModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  copyItemLinkBtn: document.getElementById('copyItemLinkBtn'),
  copyViewBtn: document.getElementById('copyViewBtn')
};

let state = { all: [], filtered: [], selectedId: null, metadata: null, lastFocused: null };

function rarityClass(rarity){ return `rarity-${String(rarity || 'Unknown').toLowerCase().replace(/\s+/g,'-')}`; }

function getFilters(){
  return {
    q: el.searchInput.value.trim(),
    rarity: el.rarityFilter.value,
    spawn: el.spawnFilter.value,
    sort: el.sortSelect.value
  };
}

function setStatus(type, msg){
  el.statusArea.innerHTML = msg ? `<div class="${type}">${msg}</div>` : '';
}

function saveFilters(){
  localStorage.setItem(FILTER_KEY, JSON.stringify(getFilters()));
}

function hydrateFilters(){
  const fromQuery = new URL(location.href).searchParams;
  const saved = JSON.parse(localStorage.getItem(FILTER_KEY) || '{}');
  el.searchInput.value = fromQuery.get('q') ?? saved.q ?? '';
  el.rarityFilter.value = fromQuery.get('rarity') ?? saved.rarity ?? 'All';
  el.spawnFilter.value = fromQuery.get('spawn') ?? saved.spawn ?? 'All';
  el.sortSelect.value = fromQuery.get('sort') ?? saved.sort ?? 'name-asc';
}

function syncQuery(){
  const u = new URL(location.href);
  const f = getFilters();
  Object.entries(f).forEach(([k,v])=>{
    if(v && v !== 'All' && !(k==='sort' && v==='name-asc')) u.searchParams.set(k,v);
    else u.searchParams.delete(k);
  });
  if(state.selectedId) u.searchParams.set('brainrot', state.selectedId);
  else u.searchParams.delete('brainrot');
  history.replaceState({},'',u.toString());
}

function optionList(select, values){
  select.innerHTML = ['All', ...values].map(v=>`<option value="${v}">${v}</option>`).join('');
}

function applyFilters(){
  const f = getFilters();
  let list = [...state.all];

  if(f.q){
    const q = f.q.toLowerCase();
    list = list.filter(x =>
      x.name.toLowerCase().includes(q) ||
      (x.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  }
  if(f.rarity !== 'All') list = list.filter(x => (x.rarity || 'Unknown') === f.rarity);
  if(f.spawn !== 'All') list = list.filter(x => (x.spawnMethod || 'Unknown') === f.spawn);

  if(f.sort === 'name-asc') list.sort((a,b)=>a.name.localeCompare(b.name));
  if(f.sort === 'name-desc') list.sort((a,b)=>b.name.localeCompare(a.name));
  if(f.sort === 'rarity') {
    list.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity) || a.name.localeCompare(b.name));
  }

  state.filtered = list;
  render();
  saveFilters();
  syncQuery();
}

function row(label,value){
  return value ? `<p><strong>${label}:</strong> ${value}</p>` : '';
}

function cardTemplate(item){
  return `<article class="item" tabindex="0" role="button" data-id="${item.id}" aria-label="Open ${item.name} details">
    <span class="badge ${rarityClass(item.rarity)}">${item.rarity || 'Unknown'}</span>
    <h3>${item.name}</h3>
    ${row('Spawn', item.spawnMethod || 'Unknown')}
    ${row('RoadWeight', item.roadWeight ?? 'Unknown')}
    ${item.notes ? `<p>${item.notes}</p>` : ''}
  </article>`;
}

function render(){
  el.resultCount.textContent = `${state.filtered.length} result${state.filtered.length===1?'':'s'}`;

  if(!state.filtered.length){
    el.results.innerHTML = '';
    setStatus('empty','No results matched your current filters.');
    return;
  }

  const metaLine = state.metadata?.lastUpdated
    ? `Data snapshot: ${state.metadata.lastUpdated}.`
    : '';
  setStatus('','');
  if (metaLine) {
    setStatus('note', metaLine);
  }
  el.results.innerHTML = state.filtered.map(cardTemplate).join('');
}

function openModal(id){
  const item = state.all.find(x=>x.id===id);
  if(!item) return;

  state.lastFocused = document.activeElement;
  state.selectedId = id;
  el.modalTitle.textContent = item.name;
  el.modalBody.innerHTML = [
    row('Rarity', item.rarity || 'Unknown'),
    row('Summary', item.summary),
    row('Aliases', (item.aliases || []).join(', ')),
    row('Spawn Method', item.spawnMethod || 'Unknown'),
    row('RoadWeight', item.roadWeight ?? 'Unknown'),
    row('Notes', item.notes || 'Needs verification'),
    row('Source Tags', (item.sourceTags || []).join(', ')),
    row('Last Updated', item.lastUpdated || 'Unknown'),
    item.sourceUrls?.length
      ? `<p><strong>Sources:</strong> ${item.sourceUrls.map(u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">link</a>`).join(' · ')}</p>`
      : ''
  ].join('');

  el.detailModal.showModal();
  el.closeModalBtn.focus();
  syncQuery();
}

function closeModal(){
  state.selectedId = null;
  if (el.detailModal.open) el.detailModal.close();
  if (state.lastFocused && typeof state.lastFocused.focus === 'function') state.lastFocused.focus();
  syncQuery();
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    const ok = window.prompt('Copy this link:', text);
    return Boolean(ok !== null);
  }
}

async function init(){
  try{
    const [dataRes, metaRes] = await Promise.all([fetch(DATA_URL), fetch(META_URL)]);
    if(!dataRes.ok) throw new Error('Could not load brainrots.json');

    state.all = await dataRes.json();
    state.metadata = metaRes.ok ? await metaRes.json() : null;

    const rarities = [...new Set(state.all.map(x=>x.rarity || 'Unknown'))]
      .sort((a,b)=>rarityOrder.indexOf(a)-rarityOrder.indexOf(b));
    const spawns = [...new Set(state.all.map(x=>x.spawnMethod || 'Unknown'))].sort();

    optionList(el.rarityFilter, rarities);
    optionList(el.spawnFilter, spawns);
    hydrateFilters();
    applyFilters();

    const deepId = new URL(location.href).searchParams.get('brainrot');
    if(deepId) openModal(deepId);
  }catch(err){
    setStatus('error', `Database load error: ${err.message}`);
  }
}

document.addEventListener('input', (e)=>{ if(e.target === el.searchInput) applyFilters(); });
document.addEventListener('change', (e)=>{ if([el.rarityFilter, el.spawnFilter, el.sortSelect].includes(e.target)) applyFilters(); });
el.clearFiltersBtn.addEventListener('click', ()=>{
  el.searchInput.value='';
  el.rarityFilter.value='All';
  el.spawnFilter.value='All';
  el.sortSelect.value='name-asc';
  applyFilters();
});
el.results.addEventListener('click', (e)=>{ const item = e.target.closest('.item'); if(item) openModal(item.dataset.id); });
el.results.addEventListener('keydown', (e)=>{ if((e.key==='Enter'||e.key===' ') && e.target.classList.contains('item')){ e.preventDefault(); openModal(e.target.dataset.id); }});
el.closeModalBtn.addEventListener('click', closeModal);
el.detailModal.addEventListener('click', (e)=>{ if(e.target === el.detailModal) closeModal(); });
el.copyItemLinkBtn.addEventListener('click', async ()=>{
  const u = new URL(location.href);
  if(state.selectedId) u.searchParams.set('brainrot', state.selectedId);
  const ok = await copyText(u.toString());
  if (ok) setStatus('note', 'Deep-link copied.');
});
el.copyViewBtn.addEventListener('click', async ()=>{
  const ok = await copyText(location.href);
  if (ok) setStatus('note', 'Current view URL copied.');
});
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && el.detailModal.open) closeModal(); });

init();
