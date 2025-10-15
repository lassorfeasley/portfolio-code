/* === BUNDLE: Homepage Features (Page-Specific) === */
/* Combined: index.js imports and filters.js */

/* === Simple homepage filter (replaces Jetboost) === */
const TYPE_LABEL_TO_SLUG = {
  'collections': null,
  'ui & interactive': 'interaction-design',
  'ux & innovation': 'innovation',
  'writing': 'writing',
  'industrial': 'industrial-design',
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
}

function buildItemIndex(itemEl) {
  const title =
    itemEl.querySelector('.window-bar .paragraph.wide')?.textContent ||
    itemEl.querySelector('.paragraph.wide')?.textContent || '';
  const desc = itemEl.querySelector('.window-content .paragraph')?.textContent || '';
  return `${normalize(title)} ${normalize(desc)}`;
}

async function fetchTypeMap() {
  try {
    const res = await fetch('/api/projects-map', { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function slugFromItem(itemEl) {
  // Prefer any hidden input present in each item (stable in Webflow export)
  const hidden = itemEl.querySelector('input[type="hidden"]');
  if (hidden?.value) return hidden.value;
  // Fallback: derive from link; support both /work/ and legacy /projects/
  const href = itemEl.querySelector('.window-content.w-inline-block')?.getAttribute('href') || '';
  const m = href.match(/\/(?:work|projects)\/([^\/?#]+)/i);
  return m ? m[1] : '';
}

function setActive(buttonEls, activeBtn) {
  buttonEls.forEach(btn => btn.classList.remove('is-active'));
  if (activeBtn) activeBtn.classList.add('is-active');
}

(async function init() {
  if (window.__homeFiltersInit) return;
  // Use the legacy wrappers present in the exported HTML (no Jetboost runtime required)
  const listWrapper = document.querySelector('.jetboost-list-wrapper-lkmq.jetboost-list-wrapper-wzyl');
  if (!listWrapper) return;
  window.__homeFiltersInit = true;

  const searchInput = document.querySelector('.jetboost-list-search-input-lkmq') || document.querySelector('#Search') || document.querySelector('input.search');
  const filterButtons = Array.from(document.querySelectorAll('.jetboost-filter-wzyl .button, .jetboost-filter-wzyl a.button'));
  filterButtons.forEach((a) => { try { a.setAttribute('href', '#'); } catch (_) {} });
  const itemsContainer = listWrapper.querySelector('.w-dyn-items');
  if (!itemsContainer) return;

  const items = Array.from(itemsContainer.querySelectorAll('.w-dyn-item'));
  if (!items.length) return;

  const typeMap = await fetchTypeMap();
  const index = new Map();

  items.forEach(item => {
    const text = buildItemIndex(item);
    const slug = slugFromItem(item);
    const typeSlug = typeMap[slug] || '';
    item.dataset.typeSlug = typeSlug || '';
    index.set(item, { text, typeSlug });
  });

  let activeType = null;
  let term = '';

  function applyFilters() {
    const t = normalize(term);
    items.forEach(item => {
      const { text, typeSlug } = index.get(item);
      const matchesTerm = !t || text.includes(t);
      const matchesType = !activeType || typeSlug === activeType;
      item.style.display = (matchesTerm && matchesType) ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      term = e.target.value || '';
      applyFilters();
    });
  }

  filterButtons.forEach(btn => {
    const label = normalize(btn.textContent);
    const type = TYPE_LABEL_TO_SLUG[label] ?? null;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activeType = type;
      setActive(filterButtons, btn);
      applyFilters();
    });
  });

  const defaultBtn = filterButtons.find(b => normalize(b.textContent) === 'collections');
  if (defaultBtn) setActive(filterButtons, defaultBtn);

  applyFilters();
})();
