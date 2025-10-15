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
      canvas.appendChild(layer);
    }
    return layer;
  }

  function floatWindow(canvas, placeholder, win) {
    // Ensure canvas is the positioning context
    if (getComputedStyle(canvas).position === 'static') {
      canvas.style.position = 'relative';
    }

    // Assign a stable mapping id between placeholder and window
    if (!placeholder.dataset[ID_ATTR]) {
      placeholder.dataset[ID_ATTR] = `${++idCounter}`;
    }
    win.dataset[ID_ATTR] = placeholder.dataset[ID_ATTR];

    // Measure where the window rendered inside the grid
    const canvasRect = canvas.getBoundingClientRect();
    const winRect = win.getBoundingClientRect();

    const left = winRect.left - canvasRect.left;
    const top = winRect.top - canvasRect.top;
    const width = winRect.width;
    const height = winRect.height;

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
    win.dataset[FLOAT_FLAG] = 'true';
  }

  function initCanvas(canvas) {
    const placeholders = canvas.querySelectorAll('.retro-window-placeholder');
    placeholders.forEach((ph) => {
      const win = ph.querySelector('.retro-window');
      if (!win) return;
      floatWindow(canvas, ph, win);
    });
  }

  function initAll() {
    document.querySelectorAll('.windowcanvas').forEach(initCanvas);
  }

  // Debounced handler to reflow on viewport size changes
  let resizeTimer;
  function refloatAll() {
    document.querySelectorAll('.windowcanvas').forEach((canvas) => {
      const layer = ensureFloatLayer(canvas);
      // For each placeholder, find its paired window in the layer and reposition
      canvas.querySelectorAll('.retro-window-placeholder').forEach((ph) => {
        const id = ph.dataset[ID_ATTR];
        const win = id ? layer.querySelector(`.retro-window[data-${ID_ATTR}="${id}"]`) : null;
        if (!win) return;

        const canvasRect = canvas.getBoundingClientRect();
        // Get where the placeholder sits in the grid now
        const phRect = ph.getBoundingClientRect();
        const left = phRect.left - canvasRect.left;
        const top = phRect.top - canvasRect.top;
        const width = phRect.width;
        const height = phRect.height;

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
})();


