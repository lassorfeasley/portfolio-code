/* === Retro Window State Store === */
(function(global) {
  if (!global || global.RetroWindowStore) return;

  const CANVAS_ATTR = 'retroCanvasId';
  const WINDOW_ATTR = 'retroWindowId';

  let canvasCounter = 0;
  let windowCounter = 0;

  const assignCanvasId = (element) => {
    if (!element) return null;
    if (!element.dataset[CANVAS_ATTR]) {
      canvasCounter += 1;
      element.dataset[CANVAS_ATTR] = `canvas-${canvasCounter}`;
    }
    return element.dataset[CANVAS_ATTR];
  };

  const assignWindowId = (canvasId, element) => {
    if (!element) return null;
    if (!element.dataset[WINDOW_ATTR]) {
      windowCounter += 1;
      const safeCanvasId = canvasId || 'canvas';
      element.dataset[WINDOW_ATTR] = `${safeCanvasId}-win-${windowCounter}`;
    }
    return element.dataset[WINDOW_ATTR];
  };

  const resolveCanvas = (store, input, allowRegister = false) => {
    if (!input) return null;
    if (typeof input === 'string') {
      return store.canvases.get(input) || null;
    }
    const attrId = input.dataset ? input.dataset[CANVAS_ATTR] : null;
    if (attrId && store.canvases.has(attrId)) {
      return store.canvases.get(attrId);
    }
    return allowRegister ? store.registerCanvas(input) : null;
  };

  class RetroWindowStore {
    constructor() {
      this.canvases = new Map();
    }

    registerCanvas(element, options = {}) {
      if (!element) return null;
      const id = assignCanvasId(element);
      const existing = this.canvases.get(id);
      const mergedOptions = { ...(existing ? existing.options : {}), ...options };
      const state = existing || {
        id,
        element,
        options: {},
        windows: new Map(),
        snapshot: [],
        rect: null,
      };
      state.options = mergedOptions;
      state.element = element;
      this.canvases.set(id, state);
      return state;
    }

    getCanvas(input) {
      return resolveCanvas(this, input, false);
    }

    listCanvasIds() {
      return Array.from(this.canvases.keys());
    }

    snapshot(input) {
      const canvasState = resolveCanvas(this, input, true);
      if (!canvasState) return [];
      const { element } = canvasState;
      const windows = Array.from(element.querySelectorAll('.retro-window'));
      const canvasRect = element.getBoundingClientRect();
      canvasState.rect = {
        width: canvasRect.width,
        height: canvasRect.height,
      };
      const seen = new Set();
      const measured = windows.map((win) => {
        const id = assignWindowId(canvasState.id, win);
        const rect = win.getBoundingClientRect();
        const base = {
          left: rect.left - canvasRect.left,
          top: rect.top - canvasRect.top,
          width: rect.width,
          height: rect.height,
        };
        let winState = canvasState.windows.get(id);
        if (!winState) {
          winState = { id, element: win, base, presentation: {} };
          canvasState.windows.set(id, winState);
        } else {
          winState.element = win;
          winState.base = base;
        }
        seen.add(id);
        return winState;
      });
      canvasState.windows.forEach((value, key) => {
        if (!seen.has(key)) {
          canvasState.windows.delete(key);
        }
      });
      canvasState.snapshot = measured;
      return measured;
    }

    getCanvasMetrics(input) {
      const canvasState = resolveCanvas(this, input, false);
      if (!canvasState) return { width: 0, height: 0 };
      if (canvasState.rect) return canvasState.rect;
      const rect = canvasState.element.getBoundingClientRect();
      canvasState.rect = { width: rect.width, height: rect.height };
      return canvasState.rect;
    }

    applyPresentation(input, updates = []) {
      const canvasState = resolveCanvas(this, input, false);
      if (!canvasState || !Array.isArray(updates) || !updates.length) return;
      updates.forEach((update) => {
        if (!update || !update.id) return;
        const winState = canvasState.windows.get(update.id);
        if (!winState) return;
        const el = winState.element;
        if (!el) return;
        winState.presentation = { ...winState.presentation, ...update };
        if (typeof update.translateX === 'number') {
          el.style.setProperty('--retro-translate-x', `${update.translateX}px`);
          el.dataset.scatterX = `${update.translateX}`;
        }
        if (typeof update.translateY === 'number') {
          el.style.setProperty('--retro-translate-y', `${update.translateY}px`);
          el.dataset.scatterY = `${update.translateY}`;
        }
        if (typeof update.width === 'number') {
          el.style.setProperty('--retro-width', `${update.width}px`);
          el.dataset.scatterWidth = `${update.width}`;
        }
        if (typeof update.zIndex === 'number') {
          el.style.setProperty('--retro-z', `${update.zIndex}`);
          el.dataset.scatterZ = `${update.zIndex}`;
        }
      });
    }

    clearPresentation(target) {
      if (!target) {
        this.canvases.forEach((canvas) => this.clearPresentation(canvas.id));
        return;
      }
      const canvasState = resolveCanvas(this, target, false);
      if (!canvasState) return;
      canvasState.windows.forEach((winState) => {
        if (!winState.element) return;
        const el = winState.element;
        el.style.removeProperty('--retro-translate-x');
        el.style.removeProperty('--retro-translate-y');
        el.style.removeProperty('--retro-width');
        el.style.removeProperty('--retro-z');
        delete el.dataset.scatterX;
        delete el.dataset.scatterY;
        delete el.dataset.scatterWidth;
        delete el.dataset.scatterZ;
        winState.presentation = {};
      });
    }
  }

  global.RetroWindowStore = new RetroWindowStore();
})(typeof window !== 'undefined' ? window : undefined);

