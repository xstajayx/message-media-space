(() => {
  'use strict';

  const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Brainrot God', 'Secret', 'OG'];
  const STORAGE_KEY = 'brainrot-db-filters-v1';

  const state = {
    metadata: null,
    entries: [],
    filtered: [],
    filters: {
      search: '',
      rarity: '',
      spawnMethod: '',
      sort: 'name-asc'
    },
    selectedId: null
  };

  const el = {
    siteTitle: document.getElementById('site-title'),
    siteDescription: document.getElementById('site-description'),
    footerDisclaimer: document.getElementById('footer-disclaimer'),
    searchInput: document.getElementById('search-input'),
    rarityFilter: document.getElementById('rarity-filter'),
    spawnFilter: document.getElementById('spawn-filter'),
    sortSelect: document.getElementById('sort-select'),
    clearFilters: document.getElementById('clear-filters'),
    resultCount: document.getElementById('result-count'),
    status: document.getElementById('status'),
    cardGrid: document.getElementById('card-grid'),
    modal: document.getElementById('detail-modal'),
    closeModal: document.getElementById('close-modal'),
    detailTitle: document.getElementById('detail-title'),
    detailRarity: document.getElementById('detail-rarity'),
    detailGrid: document.getElementById('detail-grid'),
    copyLink: document.getElementById('copy-link')
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const [metadata, entries] = await Promise.all([
        fetchJson('./data/metadata.json'),
        fetchJson('./data/brainrots.json')
      ]);

      state.metadata = metadata;
      state.entries = Array.isArray(entries) ? entries : [];

      hydrateMetadata(metadata);
      hydrateFilterOptions(metadata, state.entries);
      hydrateStateFromUrlAndStorage();
      bindEvents();
      applyFilters({ persist: false });

      const selectedFromUrl = new URLSearchParams(window.location.search).get('id');
      if (selectedFromUrl) openDetailById(selectedFromUrl);
    } catch (error) {
      showStatus(
        'error',
        'We could not load database files. Please refresh or check data/brainrots.json and data/metadata.json.'
      );
      console.error(error);
    }
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
  }

  function hydrateMetadata(metadata) {
    if (!metadata) return;
    if (metadata.siteTitle) {
      document.title = metadata.siteTitle;
      if (el.siteTitle) el.siteTitle.textContent = metadata.siteTitle;
    }
    if (metadata.description && el.siteDescription) {
      el.siteDescription.textContent = metadata.description;
    }
    if (metadata.disclaimer && el.footerDisclaimer) {
      el.footerDisclaimer.textContent = metadata.disclaimer;
    }
  }

  function hydrateFilterOptions(metadata, entries) {
    const rarities = metadata?.supportedRarities?.length
      ? metadata.supportedRarities
      : [...new Set(entries.map((entry) => entry.rarity).filter(Boolean))];
    const spawnMethods = metadata?.supportedSpawnMethods?.length
      ? metadata.supportedSpawnMethods
      : [...new Set(entries.map((entry) => entry.spawnMethod).filter(Boolean))];

    rarities.forEach((rarity) => addSelectOption(el.rarityFilter, rarity));
    spawnMethods.forEach((method) => addSelectOption(el.spawnFilter, method));
  }

  function addSelectOption(select, value) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  function hydrateStateFromUrlAndStorage() {
    const stored = readStorage();
    Object.assign(state.filters, stored);

    const params = new URLSearchParams(window.location.search);
    state.filters.search = params.get('q') ?? state.filters.search;
    state.filters.rarity = params.get('rarity') ?? state.filters.rarity;
    state.filters.spawnMethod = params.get('spawn') ?? state.filters.spawnMethod;
    state.filters.sort = params.get('sort') ?? state.filters.sort;

    el.searchInput.value = state.filters.search;
    el.rarityFilter.value = state.filters.rarity;
    el.spawnFilter.value = state.filters.spawnMethod;
    el.sortSelect.value = state.filters.sort;
  }

  function bindEvents() {
    el.searchInput.addEventListener('input', (event) => {
      state.filters.search = event.target.value.trim();
      applyFilters();
    });

    el.rarityFilter.addEventListener('change', (event) => {
      state.filters.rarity = event.target.value;
      applyFilters();
    });

    el.spawnFilter.addEventListener('change', (event) => {
      state.filters.spawnMethod = event.target.value;
      applyFilters();
    });

    el.sortSelect.addEventListener('change', (event) => {
      state.filters.sort = event.target.value;
      applyFilters();
    });

    el.clearFilters.addEventListener('click', () => {
      state.filters = { search: '', rarity: '', spawnMethod: '', sort: 'name-asc' };
      el.searchInput.value = '';
      el.rarityFilter.value = '';
      el.spawnFilter.value = '';
      el.sortSelect.value = 'name-asc';
      applyFilters();
    });

    el.closeModal.addEventListener('click', closeModal);
    el.modal.addEventListener('click', (event) => {
      if (event.target === el.modal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && el.modal.open) {
        event.preventDefault();
        closeModal();
      }
    });

    el.copyLink.addEventListener('click', copySelectedLink);
  }

  function applyFilters({ persist = true } = {}) {
    const normalizedSearch = state.filters.search.toLowerCase();

    const filtered = state.entries.filter((entry) => {
      const nameMatch = !normalizedSearch || entry.name.toLowerCase().includes(normalizedSearch);
      const rarityMatch = !state.filters.rarity || entry.rarity === state.filters.rarity;
      const spawnMatch = !state.filters.spawnMethod || entry.spawnMethod === state.filters.spawnMethod;
      return nameMatch && rarityMatch && spawnMatch;
    });

    state.filtered = sortEntries(filtered, state.filters.sort);

    if (!state.filtered.length) {
      showStatus('empty', 'No Brainrots match your current filters. Try clearing filters or another search term.');
    } else {
      hideStatus();
    }

    renderCards();
    renderResultCount();
    updateUrl();
    if (persist) writeStorage();
  }

  function sortEntries(entries, mode) {
    const list = [...entries];
    const getCost = (entry) => (typeof entry.cost === 'number' ? entry.cost : Number.POSITIVE_INFINITY);
    const getIncome = (entry) =>
      typeof entry.incomePerSecond === 'number' ? entry.incomePerSecond : Number.POSITIVE_INFINITY;

    switch (mode) {
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'rarity':
        return list.sort(
          (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) || a.name.localeCompare(b.name)
        );
      case 'cost-asc':
        return list.sort((a, b) => getCost(a) - getCost(b));
      case 'cost-desc':
        return list.sort((a, b) => getCost(b) - getCost(a));
      case 'income-asc':
        return list.sort((a, b) => getIncome(a) - getIncome(b));
      case 'income-desc':
        return list.sort((a, b) => getIncome(b) - getIncome(a));
      case 'name-asc':
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  function renderCards() {
    el.cardGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    state.filtered.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.tabIndex = 0;
      card.dataset.id = entry.id;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Open details for ${entry.name}`);
      card.innerHTML = `
        <header class="card__head">
          <h3>${escapeHtml(entry.name)}</h3>
          <span class="badge" data-rarity="${escapeHtml(entry.rarity)}">${escapeHtml(entry.rarity)}</span>
        </header>
        <p>${escapeHtml(entry.summary || 'No summary yet.')}</p>
        <div class="meta">
          ${metaTile('Cost', displayNumber(entry.cost))}
          ${metaTile('Income/s', displayNumber(entry.incomePerSecond))}
          ${metaTile('Spawn', escapeHtml(entry.spawnMethod || 'Unknown'))}
          ${metaTile('RoadWeight', displayRoadWeight(entry.roadWeight))}
        </div>
      `;

      card.addEventListener('click', () => openDetail(entry));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail(entry);
        }
      });

      fragment.appendChild(card);
    });

    el.cardGrid.appendChild(fragment);
  }

  function renderResultCount() {
    const total = state.entries.length;
    const shown = state.filtered.length;
    el.resultCount.textContent = `Showing ${shown} of ${total} Brainrots`;
  }

  function openDetailById(id) {
    const entry = state.entries.find((item) => item.id === id);
    if (entry) openDetail(entry);
  }

  function openDetail(entry) {
    state.selectedId = entry.id;
    el.detailTitle.textContent = entry.name;
    el.detailRarity.innerHTML = `<span class="badge" data-rarity="${escapeHtml(entry.rarity)}">${escapeHtml(
      entry.rarity
    )}</span>`;

    const fields = [
      ['ID', entry.id],
      ['Summary', entry.summary],
      ['Cost', displayNumber(entry.cost)],
      ['Income Per Second', displayNumber(entry.incomePerSecond)],
      ['Spawn Method', entry.spawnMethod || 'Unknown'],
      ['RoadWeight (weighted spawn value)', displayRoadWeight(entry.roadWeight)],
      ['Notes', entry.notes || 'Unknown'],
      ['Source Tags', Array.isArray(entry.sourceTags) ? entry.sourceTags.join(', ') : 'Unknown'],
      ['Last Updated', entry.lastUpdated || 'Unknown']
    ];

    el.detailGrid.innerHTML = fields
      .map(
        ([label, value]) => `
          <dl class="detail-item">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(String(value || 'Unknown'))}</dd>
          </dl>
        `
      )
      .join('');

    if (!el.modal.open) el.modal.showModal();
    updateUrl();
  }

  function closeModal() {
    state.selectedId = null;
    if (el.modal.open) el.modal.close();
    updateUrl();
  }

  async function copySelectedLink() {
    const url = new URL(window.location.href);
    if (state.selectedId) url.searchParams.set('id', state.selectedId);
    try {
      await navigator.clipboard.writeText(url.toString());
      el.copyLink.textContent = 'Copied!';
      setTimeout(() => (el.copyLink.textContent = 'Copy share link'), 1500);
    } catch {
      el.copyLink.textContent = 'Copy failed';
      setTimeout(() => (el.copyLink.textContent = 'Copy share link'), 1500);
    }
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.filters.search) params.set('q', state.filters.search);
    if (state.filters.rarity) params.set('rarity', state.filters.rarity);
    if (state.filters.spawnMethod) params.set('spawn', state.filters.spawnMethod);
    if (state.filters.sort && state.filters.sort !== 'name-asc') params.set('sort', state.filters.sort);
    if (state.selectedId) params.set('id', state.selectedId);

    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', next);
  }

  function readStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function writeStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters));
  }

  function metaTile(label, value) {
    return `<div><strong>${label}:</strong> ${value || 'Unknown'}</div>`;
  }

  function displayNumber(value) {
    return typeof value === 'number' ? value.toLocaleString() : 'Unknown';
  }

  function displayRoadWeight(value) {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && value.trim()) return value;
    return 'Unknown';
  }

  function showStatus(type, message) {
    el.status.hidden = false;
    el.status.textContent = message;
    el.status.dataset.type = type;
  }

  function hideStatus() {
    el.status.hidden = true;
    el.status.textContent = '';
    delete el.status.dataset.type;
  }

  function escapeHtml(input) {
    return String(input)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
