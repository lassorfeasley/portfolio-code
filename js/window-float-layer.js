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

