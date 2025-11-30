/* === BUNDLE: Homepage Features (Page-Specific) === */
/* Combined: index.js imports and filters.js */

/* === Simple homepage filter (replaces Jetboost) === */
const TYPE_LABEL_TO_SLUG = {
  'ui & interactive': 'interaction-design',
  'ux & innovation': 'innovation',
  'writing': 'writing',
  'industrial': 'industrial-design',
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
}

function buildItemIndex(itemEl) {
  // Prefer reading from the floated window (overlay) if the placeholder no longer contains content
  const placeholder = itemEl;
  const localWin = placeholder.querySelector('.retro-window');
  let title = '';
  let desc = '';

  if (localWin) {
    title = localWin.querySelector('.window-bar .paragraph.wide')?.textContent ||
            localWin.querySelector('.paragraph.wide')?.textContent || '';
    desc = localWin.querySelector('.window-content .paragraph')?.textContent || '';
  }

  // If the window has been floated out, look it up by data-float-id
  if (!title) {
    const floatId = placeholder.dataset.floatId || localWin?.dataset.floatId || localWin?.dataset.floatid;
    if (floatId) {
      const floated = document.querySelector(
        `.window-float-layer .retro-window[data-float-id="${floatId}"], .window-float-layer .retro-window[data-floatId="${floatId}"]`
      );
      if (floated) {
        title = floated.querySelector('.window-bar .paragraph.wide')?.textContent ||
                floated.querySelector('.paragraph.wide')?.textContent || '';
        desc = floated.querySelector('.window-content .paragraph')?.textContent || '';
      }
    }
  }

  // Final fallback: any text still present in the placeholder
  if (!title && placeholder) {
    title = placeholder.querySelector('.paragraph.wide')?.textContent || '';
  }
  if (!desc && placeholder) {
    desc = placeholder.querySelector('.window-content .paragraph')?.textContent || '';
  }

  return `${normalize(title)} ${normalize(desc)}`;
}

async function fetchTypeMap() {
  try {
    // Add timestamp to bypass cache
    const res = await fetch(`/api/projects-map?t=${Date.now()}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) {
      console.error('Failed to fetch type map:', res.status, res.statusText);
      return {};
    }
    const data = await res.json();
    console.log('Fetched type map:', data);
    return data;
  } catch (error) {
    console.error('Error fetching type map:', error);
    return {};
  }
}

function slugFromItem(itemEl) {
  // Look for the jetboost-list-item input that contains the slug
  const jetboostInput = itemEl.querySelector('input.jetboost-list-item');
  if (jetboostInput?.value) {
    console.log(`Found slug via jetboost input: ${jetboostInput.value}`);
    return jetboostInput.value;
  }
  
  // Fallback: any hidden input
  const hidden = itemEl.querySelector('input[type="hidden"]');
  if (hidden?.value) {
    console.log(`Found slug via hidden input: ${hidden.value}`);
    return hidden.value;
  }
  
  // Fallback: derive from link
  const link = itemEl.querySelector('a[href*="/work/"], a[href*="/projects/"]');
  if (link) {
    const href = link.getAttribute('href') || '';
    const m = href.match(/\/(?:work|projects)\/([^\/?#]+)/i);
    if (m) {
      console.log(`Found slug via href: ${m[1]}`);
      return m[1];
    }
  }
  
  console.warn('Could not extract slug from item:', itemEl);
  return '';
}

function setActive(buttonEls, activeBtn) {
  // Fix: Add the missing implementation to remove 'is-active' from all buttons
  buttonEls.forEach(btn => {
    btn.classList.remove('is-active');
    btn.classList.remove('jetboost-filter-active');
  });
  if (activeBtn) {
    activeBtn.classList.add('is-active');
    activeBtn.classList.add('jetboost-filter-active');
  }
}

(async function init() {
  if (window.__homeFiltersInit) return;
  
  // Add delay to ensure DOM is ready and React has hydrated
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  // Additional delay for React hydration
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Use the legacy wrappers present in the exported HTML (no Jetboost runtime required)
  const listWrapper = document.querySelector('.jetboost-list-wrapper-lkmq.jetboost-list-wrapper-wzyl');
  if (!listWrapper) {
    console.warn('Filter: List wrapper not found');
    return;
  }
  
  window.__homeFiltersInit = true;

  const searchInput = document.querySelector('.jetboost-list-search-input-lkmq') || document.querySelector('#Search') || document.querySelector('input.search');
  const filterButtons = Array.from(document.querySelectorAll('.jetboost-filter-wzyl .button, .jetboost-filter-wzyl a.button'))
    .filter(btn => normalize(btn.textContent) !== 'collections');
  
  if (!searchInput) console.warn('Filter: Search input not found');
  if (!filterButtons.length) console.warn('Filter: Filter buttons not found');
  
  filterButtons.forEach((a) => { 
    try { 
      a.setAttribute('href', '#'); 
    } catch (_) {} 
  });
  
  const itemsContainer = listWrapper.querySelector('.w-dyn-items');
  if (!itemsContainer) {
    console.warn('Filter: Items container not found');
    return;
  }

  // Mark the first item as non-filterable if it is a special intro window without a jetboost slug
  const maybeFirst = itemsContainer.querySelector('.w-dyn-item');
  if (maybeFirst && !maybeFirst.querySelector('input.jetboost-list-item')) {
    maybeFirst.classList.add('non-filterable');
  }

  // Only filter real project items; skip any non-filterable windows (e.g., intro) by class
  const allItems = Array.from(itemsContainer.querySelectorAll('.w-dyn-item'));
  const items = allItems.filter((el) => !el.classList.contains('non-filterable'));
  if (!items.length) {
    console.warn('Filter: No items found');
    return;
  }

  console.log(`Filter: Found ${items.length} items`);

  const typeMap = await fetchTypeMap();
  // Build reverse index: type -> set of slugs
  const typeToSlugs = Object.create(null);
  Object.entries(typeMap).forEach(([slug, t]) => {
    if (!t) return;
    (typeToSlugs[t] ||= new Set()).add(slug);
  });
  
  console.log('Type to slugs mapping:', Object.entries(typeToSlugs).map(([type, slugs]) => 
    ({ type, slugs: Array.from(slugs) })
  ));

  const index = new Map();

  items.forEach(item => {
    const text = buildItemIndex(item);
    const slug = slugFromItem(item);
    index.set(item, { text, slug });
  });
  
  console.log('Item slugs found:', Array.from(index.values()).map(v => v.slug));

  let activeType = null;
  let term = '';

  // Add CSS for filter hiding if not already present
  if (!document.querySelector('#filter-hide-styles')) {
    const style = document.createElement('style');
    style.id = 'filter-hide-styles';
    style.textContent = `
      .filter-hidden { 
        display: none !important; 
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function setVisible(placeholderEl, show) {
    // Debug: Log what we're trying to do
    const title = placeholderEl.querySelector('.paragraph.wide')?.textContent || 'Unknown';
    console.log(`Filter: Setting "${title}" to ${show ? 'visible' : 'hidden'}`);
    
    // Use class-based hiding for better reliability
    if (show) {
      placeholderEl.classList.remove('filter-hidden');
      // Also try direct style as backup
      placeholderEl.style.removeProperty('display');
    } else {
      placeholderEl.classList.add('filter-hidden');
      // Also try direct style as backup
      placeholderEl.style.display = 'none';
    }
    
    // Debug: Verify the class was applied
    if (!show && !placeholderEl.classList.contains('filter-hidden')) {
      console.error(`Filter: Failed to add filter-hidden class to "${title}"`);
    }
    
    // Also handle floated windows in the overlay
    // Note: the live ".retro-window" is moved out of the placeholder into
    // the overlay layer by core-effects. The mapping id is stored as
    // data-float-id (dataset.floatId) on BOTH the placeholder and the window.
    const windowEl = placeholderEl.querySelector('.retro-window');
    const floatId =
      placeholderEl.dataset.floatId ||
      windowEl?.dataset.floatId ||
      windowEl?.dataset.floatid;
    if (floatId) {
      // dataset.floatId corresponds to the attribute data-float-id in the DOM.
      // Query both kebab-case (correct) and camelCase (defensive) just in case.
      const floated = document.querySelector(
        `.window-float-layer .retro-window[data-float-id="${floatId}"], .window-float-layer .retro-window[data-floatId="${floatId}"]`
      );
      if (floated) {
        if (show) {
          floated.classList.remove('filter-hidden');
          floated.style.removeProperty('display');
        } else {
          floated.classList.add('filter-hidden');
          floated.style.display = 'none';
        }
      } else {
        console.warn('Filter: Floated window not found for id', floatId);
      }
    }
  }

  function applyFilters() {
    const t = normalize(term);
    const allowed = activeType ? typeToSlugs[activeType] : null;
    
    const gridModeShouldBeOn = Boolean(t) || Boolean(activeType);
    // Enable tidy grid while filtering; disable when cleared
    if (typeof window.retroSetGridMode === 'function') {
      window.retroSetGridMode(gridModeShouldBeOn);
    }

    let visibleCount = 0;
    let hiddenCount = 0;
    const visibleEls = [];
    const hiddenEls = [];
    // Ensure non-filterable items remain visible in grid mode
    allItems.forEach(item => {
      const isNonFilterable = item.classList.contains('non-filterable');
      const meta = index.get(item);
      // If index lookup failed (e.g., dynamic DOM shift), rebuild once lazily
      const { text, slug } = meta || { text: buildItemIndex(item), slug: slugFromItem(item) };
      if (!meta) index.set(item, { text, slug });
      const matchesTerm = !t || text.includes(t || '');
      const matchesType = !allowed || (slug && allowed.has(slug));
      const isVisible = isNonFilterable ? true : (matchesTerm && matchesType);
      setVisible(item, isVisible);
      if (isVisible) {
        visibleCount++;
        if (!isNonFilterable) visibleEls.push(item);
      } else {
        hiddenCount++;
        if (!isNonFilterable) hiddenEls.push(item);
      }
    });
    
    console.log(`Filter: Showing ${visibleCount} of ${items.length} items (${hiddenCount} hidden)`);
    
    // Debug: Check if items actually have the filter-hidden class
    const actuallyHidden = itemsContainer.querySelectorAll('.retro-window-placeholder.filter-hidden').length;
    if (actuallyHidden !== hiddenCount) {
      console.warn(`Filter: Expected ${hiddenCount} hidden items but found ${actuallyHidden} with filter-hidden class`);
    }

    // Reorder DOM so visible items rise to the top of the grid
    if (visibleEls.length && (hiddenEls.length || visibleEls[0] !== itemsContainer.firstElementChild)) {
      const frag = document.createDocumentFragment();
      visibleEls.forEach(el => frag.appendChild(el));
      hiddenEls.forEach(el => frag.appendChild(el));
      itemsContainer.appendChild(frag);
      // If grid mode is off, trigger a refloat so overlay windows follow their placeholders' new positions
      if (!gridModeShouldBeOn) {
        if (typeof window.retroRefloatAll === 'function') {
          window.retroRefloatAll();
        } else {
          window.dispatchEvent(new Event('resize'));
        }
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      term = (e.target.value || '').toString();
      term = normalize(term);
      console.log(`Filter: Search term = "${term}"`);
      applyFilters();
    });
  }

  filterButtons.forEach(btn => {
    const label = normalize(btn.textContent);
    const type = TYPE_LABEL_TO_SLUG[label] ?? null;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Toggle behavior: if clicking the same button, deselect it
      if (activeType === type) {
        activeType = null;
        console.log(`Filter: Deselected filter, showing all`);
        setActive(filterButtons, null);
      } else {
        activeType = type;
        console.log(`Filter: Active type = ${type || 'all'}`);
        setActive(filterButtons, btn);
      }
      
      applyFilters();
    });
  });

  applyFilters();
  
  // Watch for React re-renders that might remove our filter classes
  const observer = new MutationObserver((mutations) => {
    let needsReapply = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('retro-window-placeholder')) {
          // Check if our filter state was lost
          const shouldBeHidden = Array.from(items).some(item => {
            if (item === target) {
              const { text, slug } = index.get(item);
              const t = normalize(term);
              const allowed = activeType ? typeToSlugs[activeType] : null;
              const matchesTerm = !t || text.includes(t);
              const matchesType = !allowed || (slug && allowed.has(slug));
              return !(matchesTerm && matchesType);
            }
            return false;
          });
          
          if (shouldBeHidden && !target.classList.contains('filter-hidden')) {
            needsReapply = true;
          }
        }
      }
    });
    
    if (needsReapply) {
      console.warn('Filter: React removed filter classes, reapplying...');
      applyFilters();
    }
  });
  
  observer.observe(itemsContainer, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });
  
  // Periodic check to ensure filters are applied (fallback for aggressive re-renders)
  let lastFilterState = { term: '', activeType: null };
  setInterval(() => {
    if (term !== lastFilterState.term || activeType !== lastFilterState.activeType) {
      console.log('Filter: State changed, reapplying filters...');
      lastFilterState = { term, activeType };
      applyFilters();
    } else {
      // Check if any hidden items lost their hidden state
      const shouldBeHidden = [];
      items.forEach(item => {
        const { text, slug } = index.get(item);
        const t = normalize(term);
        const allowed = activeType ? typeToSlugs[activeType] : null;
        const matchesTerm = !t || text.includes(t);
        const matchesType = !allowed || (slug && allowed.has(slug));
        if (!(matchesTerm && matchesType)) {
          shouldBeHidden.push(item);
        }
      });
      
      let needsReapply = false;
      shouldBeHidden.forEach(item => {
        if (!item.classList.contains('filter-hidden') || item.style.display !== 'none') {
          needsReapply = true;
        }
      });
      
      if (needsReapply) {
        console.warn('Filter: Some items lost their hidden state, reapplying...');
        applyFilters();
      }
    }
  }, 1000); // Check every second
  
  // Export debug function to window for testing
  window.testFilterHide = () => {
    const firstItem = document.querySelector('.retro-window-placeholder');
    if (firstItem) {
      console.log('Testing hide on:', firstItem);
      firstItem.classList.add('filter-hidden');
      firstItem.style.display = 'none';
      console.log('Applied filter-hidden class and display:none');
      console.log('Current computed style:', window.getComputedStyle(firstItem).display);
      console.log('Has filter-hidden class:', firstItem.classList.contains('filter-hidden'));
    } else {
      console.log('No retro-window-placeholder found');
    }
  };
  
  console.log('Filter system initialized. Test with: window.testFilterHide()');
})();