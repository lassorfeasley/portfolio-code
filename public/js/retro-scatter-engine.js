/* === Retro Scatter Engine === */
(function(global) {
  if (!global || global.RetroScatterEngine || !global.RetroWindowStore) return;

  const DEFAULT_CONFIG = {
    minWidth: 300,
    maxWidth: 475,
    scatterX: 125,
    scatterY: 60,
    safeSidePadding: 16,
    safeBottomPadding: 80,
    allowOverflowX: 100,
    allowOverflowY: 120,
    minZ: 1,
    maxZ: 500,
    seed: 'retro-scatter',
  };

  const clamp = (value, min, max) => {
    if (typeof value !== 'number') return min;
    if (typeof min === 'number') value = Math.max(min, value);
    if (typeof max === 'number') value = Math.min(max, value);
    return value;
  };

  const hashString = (input) => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 1;
  };

  const mulberry32 = (seed) => () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  class RetroScatterEngine {
    constructor(store) {
      this.store = store;
      this.canvasConfigs = new Map();
    }

    registerCanvas(target, config = {}) {
      const canvasState = typeof target === 'string'
        ? this.store.getCanvas(target)
        : this.store.registerCanvas(target, config);
      if (!canvasState) return null;
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      this.canvasConfigs.set(canvasState.id, mergedConfig);
      return {
        id: canvasState.id,
        run: () => this.run(canvasState.id),
        config: mergedConfig,
      };
    }

    run(target) {
      const canvasState = typeof target === 'string'
        ? this.store.getCanvas(target)
        : this.store.getCanvas(target?.dataset?.retroCanvasId) || this.store.registerCanvas(target);
      if (!canvasState) return;
      const config = this.canvasConfigs.get(canvasState.id) || DEFAULT_CONFIG;
      const snapshot = this.store.snapshot(canvasState.id);
      if (!snapshot.length) return;
      const metrics = this.store.getCanvasMetrics(canvasState.id);
      const updates = snapshot.map((winState, index) => {
        const rng = this.createRng(config.seed, canvasState.id, winState.id, index);
        const width = this.selectWidth(winState, config, rng);
        const translation = this.computeTranslation(winState, width, metrics, config, rng);
        const zIndex = this.selectZIndex(config, rng);
        return {
          id: winState.id,
          width,
          translateX: translation.x,
          translateY: translation.y,
          zIndex,
        };
      });
      this.store.applyPresentation(canvasState.id, updates);
    }

    runAll() {
      this.canvasConfigs.forEach((_, canvasId) => this.run(canvasId));
    }

    selectWidth(winState, config, rng) {
      const minWidth = Math.max(0, config.minWidth || winState.base.width);
      const maxWidth = Math.max(minWidth, config.maxWidth || winState.base.width);
      if (maxWidth === minWidth) return minWidth;
      const span = maxWidth - minWidth;
      return minWidth + Math.round(rng() * span);
    }

    selectZIndex(config, rng) {
      const minZ = Math.max(0, config.minZ || 1);
      const maxZ = Math.max(minZ, config.maxZ || minZ);
      if (maxZ === minZ) return minZ;
      const span = maxZ - minZ;
      return minZ + Math.floor(rng() * (span + 1));
    }

    computeTranslation(winState, width, metrics, config, rng) {
      const base = winState.base;
      const canvasWidth = metrics.width || winState.element?.parentElement?.offsetWidth || 0;
      const canvasHeight = metrics.height || winState.element?.parentElement?.offsetHeight || 0;
      const jitterX = this.jitter(rng, config.scatterX);
      const jitterY = this.jitter(rng, config.scatterY);
      const targetWidth = width || base.width;
      const overflowX = Math.max(0, config.allowOverflowX || 0);
      const overflowY = Math.max(0, config.allowOverflowY || 0);
      const sidePadding = Math.max(0, config.safeSidePadding || 0);
      const bottomPadding = Math.max(0, config.safeBottomPadding || 0);
      const unclampedLeft = base.left + jitterX;
      const unclampedTop = base.top + jitterY;
      const minLeft = -overflowX + sidePadding;
      const maxLeft = canvasWidth - targetWidth + overflowX - sidePadding;
      const minTop = -overflowY;
      const maxTop = canvasHeight - base.height - bottomPadding + overflowY;
      const clampedLeft = clamp(unclampedLeft, minLeft, maxLeft);
      const clampedTop = clamp(unclampedTop, minTop, maxTop);
      return {
        x: Math.round(clampedLeft - base.left),
        y: Math.round(clampedTop - base.top),
      };
    }

    jitter(rng, max) {
      const span = Math.max(0, max || 0);
      if (!span) return 0;
      const range = span * 2;
      return Math.round(rng() * range) - span;
    }

    createRng(seed, canvasId, windowId, index) {
      const key = `${seed || 'scatter'}:${canvasId}:${windowId}:${index}`;
      return mulberry32(hashString(key));
    }
  }

  global.RetroScatterEngine = new RetroScatterEngine(global.RetroWindowStore);
})(typeof window !== 'undefined' ? window : undefined);

