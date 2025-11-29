/* === BUNDLE: core-effects.js === */
/* Combined: windowcanvas-lock.js, window-float-layer.js, retro-window-interaction.js, supabase-image-fallback.js */

/* === Lock windowcanvas dimensions to prevent reflow when windows are moved/resized === */
function lockWindowCanvasDimensions() {
  const canvases = document.querySelectorAll('.windowcanvas');
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    canvases.forEach(canvas => {
      if (canvas.dataset.dimensionsLocked === 'true') return;
      
      // Use offsetHeight instead of getBoundingClientRect for better performance
      const currentHeight = canvas.offsetHeight;
      
      if (currentHeight > 0) {
        canvas.style.minHeight = `${currentHeight}px`;
        canvas.dataset.dimensionsLocked = 'true';
      }
    });
  });
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Run when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(lockWindowCanvasDimensions, 100);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(lockWindowCanvasDimensions, 100);
  });
}

window.addEventListener('load', () => {
  setTimeout(lockWindowCanvasDimensions, 100);
});

// Debounced observer
const debouncedLock = debounce(lockWindowCanvasDimensions, 300);

const canvasLockObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if ((node.classList && node.classList.contains('windowcanvas')) ||
          (node.querySelectorAll && node.querySelectorAll('.windowcanvas').length > 0)) {
        debouncedLock();
        return; // Exit early once we find a match
      }
    }
  }
});

canvasLockObserver.observe(document.body, { childList: true, subtree: true });



/* === Float retro windows into an overlay layer while keeping a static ghost in the grid === */
(function () {
  const FLOAT_FLAG = 'floated';
  const ID_ATTR = 'floatId';
  let idCounter = 0;

  function ensureFloatLayer(canvas) {
    let layer = canvas.querySelector('.window-float-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'window-float-layer';
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '100%';
      layer.style.height = '100%';
      layer.style.pointerEvents = 'none';
      layer.style.zIndex = '10000';
      // Do not clip at the canvas level; allow windows to extend beyond canvas
      canvas.appendChild(layer);
    }
    return layer;
  }

  function assignId(placeholder, win) {
    if (!placeholder || !win) return;
    if (!placeholder.dataset[ID_ATTR]) {
      placeholder.dataset[ID_ATTR] = `${++idCounter}`;
    }
    win.dataset[ID_ATTR] = placeholder.dataset[ID_ATTR];
  }

  function floatWindow(canvas, placeholder, win) {
    // Respect grid mode: do not float while grid mode is active
    if (canvas && canvas.dataset && canvas.dataset.gridMode === 'true') return;
    // Ensure canvas is the positioning context
    if (getComputedStyle(canvas).position === 'static') {
      canvas.style.position = 'relative';
    }

    assignId(placeholder, win);

    // Measure where the window rendered inside the grid
    const canvasRect = canvas.getBoundingClientRect();
    const winRect = win.getBoundingClientRect();

    const width = winRect.width;
    const height = winRect.height;

    // Clamp initial position within canvas bounds, with small horizontal overflow allowance
    const SAFE_SIDE_PADDING = 16;
    const SAFE_BOTTOM_PADDING = 80;
    const ALLOW_OVERFLOW_X = 100;
    const ALLOW_OVERFLOW_Y = 150;
    const minLeft = -ALLOW_OVERFLOW_X;
    const maxLeft = canvasRect.width - width + ALLOW_OVERFLOW_X;
    const minTop = -ALLOW_OVERFLOW_Y; // allow rising above canvas a bit
    const maxTop = canvasRect.height - height + Math.max(0, ALLOW_OVERFLOW_Y - SAFE_BOTTOM_PADDING);
    const unclampedLeft = winRect.left - canvasRect.left;
    const unclampedTop = winRect.top - canvasRect.top;
    const left = Math.min(maxLeft, Math.max(minLeft, unclampedLeft));
    const top = Math.min(maxTop, Math.max(minTop, unclampedTop));

    // Lock placeholder footprint so the grid never changes
    placeholder.style.minWidth = `${width}px`;
    placeholder.style.maxWidth = `${width}px`;
    placeholder.style.minHeight = `${height}px`;
    placeholder.style.maxHeight = `${height}px`;
    if (getComputedStyle(placeholder).position === 'static') {
      placeholder.style.position = 'relative';
    }

    // Float the live window into the overlay layer
    const layer = ensureFloatLayer(canvas);
    if (win.parentElement !== layer) {
      layer.appendChild(win);
    }
    win.style.position = 'absolute';
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.width = `${width}px`;
    win.style.pointerEvents = 'auto';
    win.style.transform = '';
    win.style.removeProperty('--retro-translate-x');
    win.style.removeProperty('--retro-translate-y');
    win.style.removeProperty('--retro-width');
    win.style.removeProperty('--retro-z');
    win.dataset[FLOAT_FLAG] = 'true';
  }

  function initCanvas(canvas) {
    const placeholders = canvas.querySelectorAll('.retro-window-placeholder');
    placeholders.forEach((ph) => {
      const win = ph.querySelector('.retro-window');
      if (!win) return;
      assignId(ph, win);
    });
  }

  function initAll() {
    document.querySelectorAll('.windowcanvas').forEach(initCanvas);
  }

  // Debounced handler to reflow on viewport size changes
  let resizeTimer;
  function refloatAll() {
    document.querySelectorAll('.windowcanvas').forEach((canvas) => {
      if (canvas && canvas.dataset && canvas.dataset.gridMode === 'true') return; // hold position in grid mode
      const layer = ensureFloatLayer(canvas);
      // For each placeholder, find its paired window in the layer and reposition
      canvas.querySelectorAll('.retro-window-placeholder').forEach((ph) => {
        const id = ph.dataset[ID_ATTR];
        // Correct attribute is data-float-id; include a defensive fallback
        const win = id ? (layer.querySelector(`.retro-window[data-float-id="${id}"]`) || layer.querySelector(`.retro-window[data-floatId="${id}"]`)) : null;
        if (!win) return;

        const canvasRect = canvas.getBoundingClientRect();
        // Get where the placeholder sits in the grid now
        const phRect = ph.getBoundingClientRect();
        const width = phRect.width;
        const height = phRect.height;

        // Clamp repositioned coordinates within canvas, allow slight horizontal overflow
        const SAFE_SIDE_PADDING = 16;
        const SAFE_BOTTOM_PADDING = 80;
        const ALLOW_OVERFLOW_X = 100;
        const ALLOW_OVERFLOW_Y = 150;
        const minLeft = -ALLOW_OVERFLOW_X;
        const maxLeft = canvasRect.width - width + ALLOW_OVERFLOW_X;
        const minTop = -ALLOW_OVERFLOW_Y;
        const maxTop = canvasRect.height - height + Math.max(0, ALLOW_OVERFLOW_Y - SAFE_BOTTOM_PADDING);
        const unclampedLeft = phRect.left - canvasRect.left;
        const unclampedTop = phRect.top - canvasRect.top;
        const left = Math.min(maxLeft, Math.max(minLeft, unclampedLeft));
        const top = Math.min(maxTop, Math.max(minTop, unclampedTop));

        // Keep footprint in sync (in case of responsive changes)
        ph.style.minWidth = `${width}px`;
        ph.style.maxWidth = `${width}px`;
        ph.style.minHeight = `${height}px`;
        ph.style.maxHeight = `${height}px`;

        // Reposition the floated window to match
        win.style.left = `${left}px`;
        win.style.top = `${top}px`;
        win.style.width = `${width}px`;
      });
    });
  }

  // Expose a manual refloat hook for other scripts (e.g., filters) to call
  try { window.retroRefloatAll = refloatAll; } catch (_) {}

  // Dock all windows back into their placeholders for tidy grid mode
  function dockCanvasToGrid(canvas) {
    if (!canvas) return;
    canvas.dataset.gridMode = 'true';
    const layer = ensureFloatLayer(canvas);
    if (layer) layer.style.display = '';

    canvas.querySelectorAll('.retro-window-placeholder').forEach((ph) => {
      const id = ph.dataset[ID_ATTR];
      const win = id ? (layer.querySelector(`.retro-window[data-float-id="${id}"]`) || layer.querySelector(`.retro-window[data-floatId="${id}"]`)) : null;
      if (!win) return;
      // Reset inline styles applied during floating
      win.style.position = '';
      win.style.left = '';
      win.style.top = '';
      win.style.width = '';
      win.style.pointerEvents = '';
      delete win.dataset[FLOAT_FLAG];
      // Clear placeholder size locks so grid can flow naturally
      ph.style.minWidth = '';
      ph.style.maxWidth = '';
      ph.style.minHeight = '';
      ph.style.maxHeight = '';
      // Move window back into placeholder
      if (win.parentElement !== ph) ph.appendChild(win);
    });

    canvas.querySelectorAll('.retro-window').forEach((win) => {
      if (win.dataset[FLOAT_FLAG] === 'true') return;
      win.style.removeProperty('--retro-translate-x');
      win.style.removeProperty('--retro-translate-y');
      win.style.removeProperty('--retro-width');
      win.style.removeProperty('--retro-z');
      win.style.transform = '';
    });

    if (layer) layer.style.display = 'none';
  }

  function floatCanvasFromGrid(canvas) {
    if (!canvas) return;
    delete canvas.dataset.gridMode;
    const layer = ensureFloatLayer(canvas);
    if (layer) layer.style.display = '';
    initCanvas(canvas);
    canvas.querySelectorAll('.retro-window').forEach((win) => {
      if (win.dataset[FLOAT_FLAG] === 'true') return;
      const dx = parseFloat(win.dataset.scatterX || '0');
      const dy = parseFloat(win.dataset.scatterY || '0');
      if (dx || dy) {
        win.style.setProperty('--retro-translate-x', `${dx}px`);
        win.style.setProperty('--retro-translate-y', `${dy}px`);
      } else {
        win.style.removeProperty('--retro-translate-x');
        win.style.removeProperty('--retro-translate-y');
      }
      const scatterWidth = parseFloat(win.dataset.scatterWidth || 'NaN');
      if (!Number.isNaN(scatterWidth)) {
        win.style.setProperty('--retro-width', `${scatterWidth}px`);
      } else {
        win.style.removeProperty('--retro-width');
      }
      const scatterZ = parseFloat(win.dataset.scatterZ || 'NaN');
      if (!Number.isNaN(scatterZ)) {
        win.style.setProperty('--retro-z', `${scatterZ}`);
      } else {
        win.style.removeProperty('--retro-z');
      }
      win.style.transform = '';
    });
  }

  function dockAllToGrid() {
    document.querySelectorAll('.windowcanvas').forEach(dockCanvasToGrid);
  }

  function floatAllFromGrid() {
    document.querySelectorAll('.windowcanvas').forEach(floatCanvasFromGrid);
  }

  // Public API to toggle grid mode
  try {
    window.retroSetGridMode = function(on) {
      if (on) dockAllToGrid();
      else floatAllFromGrid();
    };
    window.retroSetGridModeFor = function(canvas, on) {
      if (on) dockCanvasToGrid(canvas);
      else floatCanvasFromGrid(canvas);
    };
  } catch (_) {}

  // Start after everything renders
  const start = () => setTimeout(initAll, 500);
  if (document.readyState === 'complete' || document.readyState === 'interactive') start();
  else window.addEventListener('load', start);

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refloatAll, 200);
  });

  // Observe for newly added windows/canvases
  const floatLayerObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (!(n instanceof HTMLElement)) continue;
        if (n.matches?.('.windowcanvas, .retro-window-placeholder') ||
            n.querySelector?.('.windowcanvas, .retro-window-placeholder')) {
          setTimeout(() => {
            if (n.matches?.('.windowcanvas')) initCanvas(n);
            else initAll();
          }, 100);
          return;
        }
      }
    }
  });
  floatLayerObserver.observe(document.body, { childList: true, subtree: true });
  function floatSingleWindow(win) {
    if (!win) return;
    const placeholder = win.closest('.retro-window-placeholder');
    const canvas = placeholder ? placeholder.closest('.windowcanvas') : null;
    if (!canvas || !placeholder) return;
    floatWindow(canvas, placeholder, win);
  }

  function dockSingleWindow(win) {
    if (!win) return;
    const id = win.dataset[ID_ATTR];
    let placeholder = null;
    if (id) {
      placeholder = document.querySelector(`.retro-window-placeholder[data-float-id="${id}"]`) ||
                    document.querySelector(`.retro-window-placeholder[data-floatId="${id}"]`);
    }
    if (!placeholder) placeholder = win.closest('.retro-window-placeholder');
    const canvas = placeholder ? placeholder.closest('.windowcanvas') : null;
    if (!placeholder || !canvas) return;

    const layer = canvas.querySelector('.window-float-layer');
    if (layer && win.parentElement === layer) {
      placeholder.appendChild(win);
    }
    win.style.position = '';
    win.style.left = '';
    win.style.top = '';
    win.style.width = '';
    win.style.pointerEvents = '';
    win.style.removeProperty('--retro-translate-x');
    win.style.removeProperty('--retro-translate-y');
    win.style.removeProperty('--retro-width');
    win.style.removeProperty('--retro-z');
    delete win.dataset[FLOAT_FLAG];
    placeholder.style.minWidth = '';
    placeholder.style.maxWidth = '';
    placeholder.style.minHeight = '';
    placeholder.style.maxHeight = '';
  }

  try {
    window.retroFloatWindow = floatSingleWindow;
    window.retroDockWindow = dockSingleWindow;
  } catch (_) {}
})();



/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
function initRetroWindowInteractions() {
  const legacySelector = '.retro-window:not([data-react-managed="true"])';
  // Treat touch/coarse pointers as mobile; disable drag/resize on mobile
  const isMobile = () => window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;
  const setupWindow = (windowEl) => {
    // Skip React-managed windows; those are handled in component code
    if (windowEl && windowEl.dataset && windowEl.dataset.reactManaged === 'true') return;
    if (!windowEl || windowEl.dataset.retroWindowInitialized === 'true') return;
    windowEl.dataset.retroWindowInitialized = 'true';
    // Required and optional elements within the window.
    const header    = windowEl.querySelector('.window-bar');
    const closeBtn  = windowEl.querySelector('.x-out');
    const resizer   = windowEl.querySelector('.resize-corner');
    const contentEl = windowEl.querySelector('.window-content');
    const link      = windowEl.querySelector('a, .link-block');

    // If no header, skip this window.
    if (!header) return;

    // ---------------------------------------------------
    // Helper: Get computed z-index
    // ---------------------------------------------------
    const getZIndex = (el) => {
      const z = parseInt(window.getComputedStyle(el).zIndex, 10);
      return isNaN(z) ? 0 : z;
    };

    // ---------------------------------------------------
    // Bring-to-Front Helper
    // ---------------------------------------------------
    const bringToFront = () => {
      const allWindows = Array.from(document.querySelectorAll('.retro-window'));
      const maxZ = allWindows.reduce((max, el) => Math.max(max, getZIndex(el)), 0);
      windowEl.style.zIndex = maxZ + 1;
    };

    // ---------------------------------------------------
    // Global Mouse Down: Bring window to front if the click is NOT on a link.
    // ---------------------------------------------------
    windowEl.addEventListener('mousedown', (e) => {
      // If the click target is a link (or inside one), do nothing. Let the link handler manage it.
      if (!e.target.closest('a, .link-block')) {
        bringToFront();
      }
    }, true);

    // ---------------------------------------------------
    // DRAG FUNCTIONALITY: Header Drag to Move and Bring Window Forward.
    // ---------------------------------------------------
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let lockedWidth = 0;
    let lockedHeight = 0;
    header.addEventListener('mousedown', (e) => {
      if (isMobile()) return; // disable header drag on mobile
      e.preventDefault();
      try { if (typeof window.retroFloatWindow === 'function') window.retroFloatWindow(windowEl); } catch (_) {}
      isDragging = true;
      // Remove breathing shadow and static shadow when dragging starts
      windowEl.classList.remove('breathing-shadow');
      windowEl.classList.add('no-static-shadow');
      bringToFront();

      // Lock current size before taking the element out of normal flow
      const rect = windowEl.getBoundingClientRect();
      lockedWidth = rect.width;
      lockedHeight = rect.height;
      
      // Set position first, then enforce width with !important to override CSS rules
      windowEl.style.position = 'absolute';
      // Use setProperty with important flag to override CSS !important rules
      windowEl.style.setProperty('width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('max-width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('height', `${lockedHeight}px`, 'important');
      windowEl.style.setProperty('max-height', `${lockedHeight}px`, 'important');
      
      const currentLeft = parseInt(windowEl.style.left, 10) || windowEl.offsetLeft;
      const currentTop  = parseInt(windowEl.style.top, 10) || windowEl.offsetTop;
      const canvas = windowEl.closest('.windowcanvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
      // Compute offset in canvas (layer) coordinates
      offsetX = (e.pageX - canvasRect.left) - currentLeft;
      offsetY = (e.pageY - canvasRect.top)  - currentTop;
      windowEl.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      // Re-enforce width/height during drag to prevent CSS from overriding
      windowEl.style.setProperty('width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('max-width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('height', `${lockedHeight}px`, 'important');
      windowEl.style.setProperty('max-height', `${lockedHeight}px`, 'important');
      // Clamp drag within its canvas using layer-relative coordinates
      const canvas = windowEl.closest('.windowcanvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      const SAFE_SIDE_PADDING = 16;
      const SAFE_BOTTOM_PADDING = 80;
      const ALLOW_OVERFLOW_X = 100;
      const ALLOW_OVERFLOW_Y = 150;
      const minLeft = -ALLOW_OVERFLOW_X;
      const maxLeft = canvasRect.width - lockedWidth + ALLOW_OVERFLOW_X;
      const minTop = -ALLOW_OVERFLOW_Y;
      const maxTop = canvasRect.height - lockedHeight + Math.max(0, ALLOW_OVERFLOW_Y - SAFE_BOTTOM_PADDING);
      const pointerX = e.pageX - canvasRect.left;
      const pointerY = e.pageY - canvasRect.top;
      const targetLeft = Math.min(maxLeft, Math.max(minLeft, pointerX - offsetX));
      const targetTop  = Math.min(maxTop, Math.max(minTop,  pointerY - offsetY));
      windowEl.style.left = `${targetLeft}px`;
      windowEl.style.top  = `${targetTop}px`;
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        windowEl.style.cursor = 'default';
        windowEl.classList.remove('no-static-shadow');
        // Clear width/height constraints after dragging ends (remove important flag)
        windowEl.style.removeProperty('width');
        windowEl.style.removeProperty('max-width');
        windowEl.style.removeProperty('height');
        windowEl.style.removeProperty('max-height');
        
        // Set dimensions explicitly as normal inline styles to prevent snap-back
        // This preserves the size captured at the start of the drag
        windowEl.style.width = `${lockedWidth}px`;
        windowEl.style.height = `${lockedHeight}px`;

        // Restore breathing shadow by calling updateBreathingShadow if available
        if (typeof updateBreathingShadow === 'function') {
          try {
            updateBreathingShadow();
          } catch (e) {
            // Silently fail if updateBreathingShadow has issues
          }
        }
      }
    });

    // ---------------------------------------------------
    // CLOSE BUTTON FUNCTIONALITY
    // ---------------------------------------------------
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        windowEl.style.display = 'none';
      });
    }

    // ---------------------------------------------------
    // RESIZE FUNCTIONALITY
    // ---------------------------------------------------
    if (resizer) {
      let isResizing = false;
      let startX, startY, startWidth, startHeight;

      resizer.addEventListener('mousedown', (e) => {
        if (isMobile()) return; // disable resize on mobile
        e.preventDefault();
        try { if (typeof window.retroFloatWindow === 'function') window.retroFloatWindow(windowEl); } catch (_) {}
        isResizing = true;
        bringToFront();

        startX = e.pageX;
        startY = e.pageY;
        startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
        startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });

      const doResize = (e) => {
        if (!isResizing) return;
        const newWidth = Math.max(200, startWidth + (e.pageX - startX));
        const newHeight = Math.max(100, startHeight + (e.pageY - startY));
        windowEl.style.width = `${newWidth}px`;
        windowEl.style.height = `${newHeight}px`;

        if (contentEl) {
          contentEl.style.maxWidth = `${newWidth}px`;
          contentEl.style.maxHeight = `${newHeight}px`;
        }
      };

      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }

    // ---------------------------------------------------
    // LINK CLICK HANDLER: Two-Click Activation
    // ---------------------------------------------------
    if (link) {
      link.addEventListener('click', (e) => {
        const allWindows = Array.from(document.querySelectorAll('.retro-window'));
        const maxZ = allWindows.reduce((max, el) => Math.max(max, getZIndex(el)), 0);
        const thisZ = getZIndex(windowEl);

        // If this window is not the top window, prevent the link activation.
        if (thisZ < maxZ) {
          e.preventDefault();
          e.stopPropagation();
          bringToFront();
          console.log("Window was behind: First click brings it to front. Click again to activate the link.");
        }
      });
    }
  };

  // Initialize currently present windows (including those inside project-type lists)
  document.querySelectorAll(legacySelector).forEach(setupWindow);

  // Observe for windows added after client-side navigation
  const windowInteractionObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches?.(legacySelector)) {
          setupWindow(n);
        }
        // Also search within subtree
        n.querySelectorAll && n.querySelectorAll(legacySelector).forEach(setupWindow);
      });
    }
  });
  windowInteractionObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initRetroWindowInteractions(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initRetroWindowInteractions);
}


/* === Swap Supabase transformed image URLs to original object URLs on error (400/403/etc.) === */
(function () {
  function toOriginalUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      if (!/\/storage\/v1\/render\/image\//.test(u.pathname)) return url;
      u.pathname = u.pathname.replace('/storage/v1/render/image/', '/storage/v1/object/');
      u.search = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  function isTransformed(url) {
    try { return /\/storage\/v1\/render\/image\//.test(new URL(url, location.href).pathname); }
    catch { return false; }
  }

  // Global error handler for <img> loads
  window.addEventListener('error', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLImageElement)) return;
    const src = target.currentSrc || target.src || '';
    if (!isTransformed(src)) return;
    const fallback = toOriginalUrl(src);
    if (fallback && fallback !== src) {
      // Prevent infinite loops
      target.onerror = null;
      target.crossOrigin = '';
      target.src = fallback;
    }
  }, true);
})();



