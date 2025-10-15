/* === BUNDLE: Visual Effects (Non-Critical) === */
/* Combined: breathing-shadow-apply.js, drag-echo-effect.js, pixel-image-load-effect.js, window-randomizer.js, drag-and-drop-icons.js */

/* === Causes active window to have a breathing shadow effect (the effect is stored in webflow) === */
let cachedTopWindow = null;
let windows = [];

// Function: Find window with highest z-index
function findTopWindow() {
  let topWindow = null;
  let highestZIndex = -Infinity;

  windows.forEach(win => {
    const z = parseInt(window.getComputedStyle(win).zIndex, 10);
    if (z > highestZIndex) {
      highestZIndex = z;
      topWindow = win;
    }
  });

  return topWindow;
}

// Function: Update breathing shadow animation
function updateBreathingShadow() {
  // Only update if windows exist
  if (windows.length === 0) {
    windows = Array.from(document.querySelectorAll('.retro-window'));
  }

  const topWindow = findTopWindow();

  // Only update DOM if the top window changed
  if (topWindow !== cachedTopWindow) {
    windows.forEach(win => {
      if (win === topWindow) {
        if (!win.classList.contains('breathing-shadow')) {
          win.classList.add('breathing-shadow');
        }
      } else {
        if (win.classList.contains('breathing-shadow')) {
          win.classList.remove('breathing-shadow');
        }
      }
    });
    cachedTopWindow = topWindow;
  }
}

// Initialize on page load
function initBreathingShadow() {
  windows = Array.from(document.querySelectorAll('.retro-window'));
  updateBreathingShadow();
  
  // Less frequent polling - only check every 2 seconds as a fallback
  setInterval(() => {
    // Refresh windows list periodically
    const currentWindows = document.querySelectorAll('.retro-window');
    if (currentWindows.length !== windows.length) {
      windows = Array.from(currentWindows);
    }
    updateBreathingShadow();
  }, 2000);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initBreathingShadow(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initBreathingShadow);
}

// Event delegation for better performance
document.addEventListener('mousedown', (e) => {
  const win = e.target.closest('.retro-window');
  if (win) {
    // Refresh windows list if needed
    windows = Array.from(document.querySelectorAll('.retro-window'));
    setTimeout(updateBreathingShadow, 10);
  }
}, true);

/* === Causes a 'drag echo' effect when dragging elements === */
// === Easy-to-configure variables ===
const PIXEL_DISTANCE_FOR_ECHO = 10;   // How many pixels movement before leaving an echo
const ECHO_DURATION_MS = 2000;        // How long each echo lasts (milliseconds)
const MAX_ECHOS = 500;                // Maximum number of echoes visible at once
const ECHO_OPACITY = 1;               // Opacity of each echo
const ECHO_BLUR = '0px';              // Blur applied to echoes (CSS blur)

// Echo management
let echos = [];

// Throttle helper - limits how often a function can be called
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function createEcho(el) {
  // Clone the original element
  const echo = el.cloneNode(true);

  // Get computed style to preserve visual appearance
  const style = window.getComputedStyle(el);

  // Set basic styling for the echo
  echo.style.position = 'absolute';
  echo.style.pointerEvents = 'none';
  echo.style.margin = '0';
  echo.style.left = el.style.left;
  echo.style.top = el.style.top;
  echo.style.width = style.width;
  echo.style.height = style.height;
  echo.style.opacity = ECHO_OPACITY;
  echo.style.filter = `blur(${ECHO_BLUR})`;
  echo.style.zIndex = parseInt(style.zIndex || 0, 10) - 1; // behind original

  // Add echo to DOM
  el.parentElement.appendChild(echo);
  echos.push(echo);

  // Remove echo after specified duration without dissolve
  setTimeout(() => {
    if (echo.parentElement) echo.parentElement.removeChild(echo);
    echos = echos.filter(e => e !== echo);
  }, ECHO_DURATION_MS);

  // Maintain maximum number of echoes
  if (echos.length > MAX_ECHOS) {
    const oldEcho = echos.shift();
    if (oldEcho.parentElement) oldEcho.parentElement.removeChild(oldEcho);
  }
}

// Setup echo effect on draggable elements
function setupEchoEffect(draggableSelector) {
  const draggables = document.querySelectorAll(draggableSelector);
  
  draggables.forEach(draggable => {
    // Skip if already initialized to prevent duplicate listeners
    if (draggable.dataset.echoInitialized === 'true') return;
    draggable.dataset.echoInitialized = 'true';
    
    let lastX = null;
    let lastY = null;
    let mouseMoveHandler = null;

    draggable.addEventListener('mousedown', () => {
      // Mark element as echo-active to disable expensive breathing shadow
      draggable.dataset.echoActive = 'true';
      // Also remove heavy static blur shadow while echoing
      draggable.classList.add('no-static-shadow');
      lastX = parseInt(draggable.style.left, 10) || draggable.offsetLeft;
      lastY = parseInt(draggable.style.top, 10) || draggable.offsetTop;

      // Throttled handler to reduce calls - max ~20 echoes per second
      const checkAndCreateEcho = throttle(() => {
        const currentX = parseInt(draggable.style.left, 10);
        const currentY = parseInt(draggable.style.top, 10);

        const distanceMoved = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));

        if (distanceMoved >= PIXEL_DISTANCE_FOR_ECHO) {
          createEcho(draggable);
          lastX = currentX;
          lastY = currentY;
        }
      }, 50);

      mouseMoveHandler = checkAndCreateEcho;
      document.addEventListener('mousemove', mouseMoveHandler);

      const mouseUpHandler = () => {
        // Clean up event listener
        document.removeEventListener('mousemove', mouseMoveHandler);
        // Clear echo-active mark and request shadow recompute
        delete draggable.dataset.echoActive;
        draggable.classList.remove('no-static-shadow');
        try { if (typeof updateBreathingShadow === 'function') updateBreathingShadow(); } catch (_) {}
      };
      
      document.addEventListener('mouseup', mouseUpHandler, { once: true });
    });
  });
}

// Initialize on page load
function initEcho() {
  // Initial attach
  setupEchoEffect('.retro-window, .draggable-folder');

  // Debounced observer to batch DOM changes and reduce overhead
  let debounceTimer;
  const echoObserver = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setupEchoEffect('.retro-window, .draggable-folder');
    }, 200);
  });
  echoObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initEcho(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initEcho);
}

/* === Makes images load in a pixelated effect === */
function initPixelImageLoadEffect() {
  // Slightly faster steps for thumbnails to reduce time looking blocky
  const steps = 5;
  const totalTargetDuration = 3000;
  const minStepDelay = 200;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  // CORS-safe draw sources for each prepared image (keyed by canvasId)
  const drawSources = new Map();

  // ---- Concurrency control (limit simultaneous animations) ----
  const MAX_CONCURRENT = 3;
  const running = new Set(); // canvasId set
  const pending = [];
  function enqueue(img, start) {
    const id = img.dataset.canvasId;
    if (!id) return start();
    if (running.size < MAX_CONCURRENT) {
      running.add(id);
      start();
    } else {
      pending.push({ img, start, id });
    }
  }
  function finish(id) {
    if (id) running.delete(id);
    while (running.size < MAX_CONCURRENT && pending.length) {
      const item = pending.shift();
      if (!item) break;
      if (!item.img.isConnected || item.img.dataset.animationFinished === 'true') continue;
      running.add(item.id);
      item.start();
    }
  }

  // Decide if an image should be pixelated (skip lightbox and explicit opt-outs)
  function shouldPixelate(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (img.classList && img.classList.contains('no-pixelate')) return false;
    if (img.closest && img.closest('.lf-lightbox-backdrop')) return false;
    return true;
  }

  function getDisplayedSize(img) {
    const rect = img.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    
    // If dimensions are zero or not set, calculate from natural size
    if (!w || !h) {
      if (img.naturalWidth && img.naturalHeight) {
        w = img.naturalWidth;
        h = img.naturalHeight;
      } else if (img.parentElement) {
        const pr = img.parentElement.getBoundingClientRect();
        w = pr.width || 1;
        h = pr.height || 1;
      } else {
        w = 1; h = 1;
      }
    }
    
    // Constrain to parent container width if the image would overflow
    if (img.parentElement) {
      const parentWidth = img.parentElement.getBoundingClientRect().width;
      if (parentWidth > 0 && w > parentWidth) {
        const aspectRatio = h / w;
        w = parentWidth;
        h = w * aspectRatio;
      }
    }
    
    return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
  }

  // Window-level IO: trigger all images in a window when the window nears viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        triggerImagesInWindow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0,            // trigger even if tiny area intersects
    rootMargin: '400px 0px'  // start well before entering viewport
  });

  const retroWindows = document.querySelectorAll(".retro-window");

  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (!shouldPixelate(img)) return;
      if (img.complete) {
        prepareInitialPixel(img);
      } else {
        img.addEventListener("load", () => { if (shouldPixelate(img)) prepareInitialPixel(img); });
      }
    });
    
    // Check if window is already in viewport immediately
    const rect = windowEl.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }, 50);
    }
    
    observer.observe(windowEl);
  });

  window.addEventListener("load", () => {
    retroWindows.forEach(windowEl => {
      const rect = windowEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }
    });
  });

  // Observe dynamically-added windows so their images pixelate
  // Scoped & debounced observers per windowcanvas to avoid global churn
  document.querySelectorAll('.windowcanvas').forEach((target) => {
    let t;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        // Skip anything inside the lightbox
        target.querySelectorAll('img').forEach((img) => {
          if (!shouldPixelate(img) || img.dataset.canvasId) return;
          if (img.complete) {
            prepareInitialPixel(img);
            if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
          } else {
            img.addEventListener('load', () => {
              if (!shouldPixelate(img) || img.dataset.canvasId) return;
              prepareInitialPixel(img);
              if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
            });
          }
        });
      }, 200);
    });
    mo.observe(target, { childList: true, subtree: true });
  });

  // Fallback: pixelate images that are not inside .retro-window across all pages
  // Image-level IO: robustly trigger even for tiny/late-sized images
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      imgObserver.unobserve(img);
      // ensure prepared
      if (!img.dataset.canvasId) prepareInitialPixel(img);
      pixelate(img);
    });
  }, { threshold: 0, rootMargin: '200px 0px' });

  // Exclude lightbox full-size images from pixelation using a do-not-pixelate class
  const allImages = Array.from(document.querySelectorAll('img')).filter(shouldPixelate);
  allImages.forEach((img) => {
    if (img.dataset.canvasId) return;
    if (img.complete) {
      prepareInitialPixel(img);
      if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
    } else {
      img.addEventListener('load', () => {
        if (img.dataset.canvasId) return;
        prepareInitialPixel(img);
        if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
      });
    }
  });

  // Safety net: after first paint, ensure any visible, unanimated images are triggered
  setTimeout(() => {
    document.querySelectorAll('img').forEach((img) => {
      if (img.dataset.animationFinished === 'true' || img.dataset.animationStarted === 'true') return;
      if (!isInViewport(img)) return;
      if (!img.dataset.canvasId) prepareInitialPixel(img);
      pixelate(img);
    });
  }, 1200);

  function triggerImagesInWindow(windowEl) {
    windowEl.dataset.animationTriggerActivated = "true"; // Mark the window as ready for animations
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (!shouldPixelate(img)) return;
      // Only attempt to pixelate if the image has been prepared (canvasId exists)
      // and its parent window is now marked as activated.
      // pixelate() itself has guards against re-animating.
      if (img.dataset.canvasId) {
        pixelate(img);
      }
      // If canvasId is not set yet, prepareInitialPixel will handle calling pixelate
      // for this image once it's ready, because windowEl.dataset.animationTriggerActivated is now true.
    });
  }

  function prepareInitialPixel(img) {
    // Get actual displayed size before any manipulation
    const size = getDisplayedSize(img);
    
    // Store computed display value to preserve inline vs block behavior
    const computedDisplay = window.getComputedStyle(img).display;
    
    // Store original styles AND the actual displayed dimensions
    const originalStyles = {
      width: img.style.width,
      height: img.style.height,
      position: img.style.position,
      display: img.style.display,
      verticalAlign: img.style.verticalAlign
    };
    img.dataset.originalStyles = JSON.stringify(originalStyles);
    // Store the actual dimensions to lock them in after animation
    img.dataset.displayWidth = size.width;
    img.dataset.displayHeight = size.height;
    img.dataset.computedDisplay = computedDisplay;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match displayed image size (robust on mobile)
    canvas.width = size.width;
    canvas.height = size.height;
    
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.objectFit = 'cover';
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";
    
    // Store the original aspect ratio to maintain it during animation
    const aspectRatio = size.width / size.height;
    canvas.dataset.aspectRatio = aspectRatio;

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.classList.add("pixel-loading-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";

    // If this image lives in a fixed-aspect thumbnail frame, let wrapper fill its parent
    const inThumb = !!img.closest('.thumb-frame');
    if (inThumb) {
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      img.dataset.isThumb = 'true';
      
      // For thumbnails, the canvas should fill the wrapper completely (like object-fit: cover)
      // The wrapper will be constrained by the parent .thumb-frame's aspect-ratio: 4/3
      const parentRect = img.closest('.thumb-frame').getBoundingClientRect();
      if (parentRect.width > 0 && parentRect.height > 0) {
        // Canvas should match the wrapper's dimensions exactly
        canvas.width = parentRect.width;
        canvas.height = parentRect.height;
      }
    } else {
      wrapper.style.width = size.width + "px";
      wrapper.style.height = size.height + "px";
    }
    wrapper.style.maxWidth = "100%";

    // Position image
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = 'cover';
    img.style.visibility = "hidden";

    // Set up DOM structure
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);

    img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);

    // Prepare a CORS-enabled draw source so canvas drawImage is allowed
    const srcImg = new Image();
    srcImg.crossOrigin = 'anonymous';
    srcImg.decoding = 'async';
    srcImg.src = img.currentSrc || img.src;
    const doInitialDraw = () => {
      drawSources.set(canvas.id, srcImg);
      try { drawPixelStep(img, canvas, ctx, steps); } catch (_) {}
      const parentWindow = img.closest('.retro-window');
      if (parentWindow && parentWindow.dataset.animationTriggerActivated === "true") {
        pixelate(img);
      }
    };
    const handleError = () => {
      try {
        // If transformer URL failed, swap both the DOM img and draw source to original object URL
        const toOriginal = (url) => {
          try {
            const u = new URL(url, window.location.href);
            if (/\/storage\/v1\/render\/image\//.test(u.pathname)) {
              u.pathname = u.pathname.replace('/storage/v1/render/image/', '/storage/v1/object/');
              u.search = '';
              return u.toString();
            }
            return url;
          } catch { return url; }
        };
        const fallbackUrl = toOriginal(img.currentSrc || img.src);
        if (fallbackUrl && fallbackUrl !== (img.currentSrc || img.src)) {
          img.crossOrigin = '';
          img.src = fallbackUrl;
        }
        const drawFallback = toOriginal(srcImg.src);
        if (drawFallback && drawFallback !== srcImg.src) {
          srcImg.crossOrigin = '';
          srcImg.onload = doInitialDraw;
          srcImg.onerror = () => { /* if this also fails, reveal img via finalize safety */ };
          srcImg.src = drawFallback;
          return;
        }
        // As an ultimate fallback, reveal image and remove canvas
        const wrapper = canvas.parentElement;
        if (wrapper) {
          img.style.visibility = 'visible';
          canvas.remove();
        }
      } catch (_) {}
    };
    if (srcImg.complete && srcImg.naturalWidth > 0) doInitialDraw();
    else {
      srcImg.onload = doInitialDraw;
      srcImg.onerror = handleError;
    }
  }

  function pixelate(img) {
    if (!img.dataset.canvasId) {
      // console.warn("pixelate: canvasId not set for image:", img.src, ". Image may not be loaded/prepared yet.");
      return;
    }
    const canvas = document.getElementById(img.dataset.canvasId);
    if (!canvas) {
      // console.error("Pixelate: Canvas element not found for ID:", img.dataset.canvasId, "for image:", img.src);
      return;
    }

    if (img.dataset.animationFinished === "true") {
      return; // Animation already completed
    }
    if (img.dataset.animationStarted === "true") {
      return; // Animation already in progress
    }
    img.dataset.animationStarted = "true";

    const ctx = canvas.getContext("2d", { alpha: false });

    // Ensure we have a CORS-safe draw source before starting
    const src = drawSources.get(img.dataset.canvasId);
    if (!src || !src.complete || src.naturalWidth === 0) {
      const tmp = new Image();
      tmp.crossOrigin = 'anonymous';
      tmp.decoding = 'async';
      tmp.src = img.currentSrc || img.src;
      tmp.onload = () => { drawSources.set(img.dataset.canvasId, tmp); /* will start in enqueue below */ };
      tmp.onerror = () => { /* fallback to finalize via safety timeout */ };
    }

    const isThumb = img.dataset.isThumb === 'true';
    const localSteps = isThumb ? 3 : steps;
    const durationMs = isThumb ? 1500 : 3000;

    // Idempotent finalizer to ensure we always reveal the image
    function finalize() {
      if (img.dataset.animationFinished === "true") return;
      const canvas = document.getElementById(img.dataset.canvasId || "");
      const wrapper = canvas ? canvas.parentElement : img.closest('.pixel-loading-wrapper');
      if (!wrapper) return;

      // Reveal image and restore natural positioning inside wrapper
      img.style.position = "";
      img.style.top = "";
      img.style.left = "";
      img.style.visibility = "visible";

      // If this was a thumbnail inside a fixed-aspect frame, keep wrapper fluid
      const isThumb = img.dataset.isThumb === 'true' || (img.closest && img.closest('.thumb-frame'));
      if (isThumb) {
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
        try { img.style.objectFit = 'cover'; } catch (_) {}
      } else {
        // For non-thumbnail images, lock wrapper to measured px to avoid reflow/jumps
        const displayWidth = parseInt(img.dataset.displayWidth || '0', 10);
        const displayHeight = parseInt(img.dataset.displayHeight || '0', 10);
        if (displayWidth && displayHeight) {
          wrapper.style.width = displayWidth + "px";
          wrapper.style.height = displayHeight + "px";
        }
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
      }

      // Remove the canvas overlay if present
      if (canvas && canvas.parentElement) canvas.remove();

      delete img.dataset.animationStarted;
      img.dataset.animationFinished = "true";
      drawSources.delete(img.dataset.canvasId);
      finish(img.dataset.canvasId);
    }
    // Safety net: force completion if timers are throttled or interrupted
    setTimeout(finalize, durationMs + 2000);

    // rAF-driven animation using a reusable downCanvas
    const downCanvas = (function() {
      if ('OffscreenCanvas' in window) return new OffscreenCanvas(1, 1);
      const c = document.createElement('canvas');
      c.width = c.height = 1; return c;
    })();

    const source = drawSources.get(img.dataset.canvasId) || img;
    let startTime = 0;
    let lastStep = -1;

    enqueue(img, () => {
      function frame(ts) {
        if (img.dataset.animationFinished === 'true') return;
        if (!startTime) startTime = ts;
        const t = Math.min(1, (ts - startTime) / durationMs);
        const step = Math.max(0, Math.round((1 - t) * localSteps));
        if (step !== lastStep) {
          lastStep = step;
          // Draw current step
          const pixelSize = Math.max(1, Math.pow(2, step));
          const dc = downCanvas;
          dc.width = Math.max(1, Math.round(canvas.width / pixelSize));
          dc.height = Math.max(1, Math.round(canvas.height / pixelSize));
          const dctx = dc.getContext('2d', { alpha: false });
          dctx.imageSmoothingEnabled = false;
          try {
            dctx.clearRect(0, 0, dc.width, dc.height);
            
            // For thumbnails, we need to crop the image to fit the canvas (like object-fit: cover)
            if (img.dataset.isThumb === 'true') {
              // Calculate source and destination rectangles for object-fit: cover behavior
              const sourceAspectRatio = source.width / source.height;
              const canvasAspectRatio = dc.width / dc.height;
              
              let sourceX = 0, sourceY = 0, sourceWidth = source.width, sourceHeight = source.height;
              
              if (sourceAspectRatio > canvasAspectRatio) {
                // Source is wider - crop width
                sourceWidth = source.height * canvasAspectRatio;
                sourceX = (source.width - sourceWidth) / 2;
              } else {
                // Source is taller - crop height
                sourceHeight = source.width / canvasAspectRatio;
                sourceY = (source.height - sourceHeight) / 2;
              }
              
              dctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, dc.width, dc.height);
            } else {
              // For non-thumbnails, draw normally
              dctx.drawImage(source, 0, 0, dc.width, dc.height);
            }
            
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(dc, 0, 0, canvas.width, canvas.height);
          } catch {}
        }
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          finalize();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function drawPixelStep(img, canvas, ctx, exponent) {
    const pixelSize = Math.pow(2, exponent);
    const source = (img && img.dataset && drawSources.get(img.dataset.canvasId)) || img;
    const downCanvas = document.createElement("canvas");
    downCanvas.width = Math.max(1, Math.round(canvas.width / pixelSize));
    downCanvas.height = Math.max(1, Math.round(canvas.height / pixelSize));
    const downCtx = downCanvas.getContext("2d");
    downCtx.imageSmoothingEnabled = false;
    try {
      downCtx.drawImage(source, 0, 0, downCanvas.width, downCanvas.height);
    } catch (_) {
      // If draw fails (e.g., broken image), skip this step silently
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
    } catch (_) { /* ignore */ }
  }

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initPixelImageLoadEffect(); } catch (e) { console.error(e); }
} else {
  document.addEventListener('DOMContentLoaded', initPixelImageLoadEffect);
}

/* === Causes retro windows to be randomly positioned and  on the screen === */
function initRandomizer() {
  // Only run the script if the screen is at least as wide as an iPad in landscape (1024px)
  if (!window.matchMedia('(min-width: 1024px)').matches) {
    return;
  }

  // Adjustable parameters
  const MIN_WIDTH = 300;              // Minimum width for each retro window (in pixels)
  const MAX_WIDTH = 475;              // Maximum width for each retro window (in pixels)
  const MAX_HORIZONTAL_SCATTER = 125; // Maximum horizontal scatter (in pixels)
  const MAX_VERTICAL_SCATTER = 50;   // Maximum vertical scatter (in pixels)

  // Find each container that should have a cluttered desktop effect
  const clutteredContainers = document.querySelectorAll('.cluttered-desktop-container');

  clutteredContainers.forEach(container => {
    // Ensure the container stays in place:
    // 1. Set its position to relative (to serve as positioning context)
    // 2. Lock in its height so that it won't collapse when children are set to absolute.
    container.style.position = 'relative';
    container.style.height = container.offsetHeight + 'px';

    // Select all retro windows inside this container.
    const windows = container.querySelectorAll('.retro-window');

    // Utility function to generate a random offset in the range [-max, max]
    const randomOffset = (max) => (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * (max + 1));

    windows.forEach(win => {
      // Capture the original rendered position from the static layout.
      const originalLeft = win.offsetLeft;
      const originalTop  = win.offsetTop;

      // 1. Randomize width between MIN_WIDTH and MAX_WIDTH.
      const randomWidth = Math.floor(Math.random() * (MAX_WIDTH - MIN_WIDTH + 1)) + MIN_WIDTH;
      win.style.width = randomWidth + 'px';

      // 2. Randomize the z-index between 1 and 500.
      const randomZIndex = Math.floor(Math.random() * 500) + 1;
      win.style.zIndex = randomZIndex;

      // 3. Calculate random horizontal and vertical offsets.
      const deltaLeft = randomOffset(MAX_HORIZONTAL_SCATTER);
      const deltaTop  = randomOffset(MAX_VERTICAL_SCATTER);

      // 4. Set the window to absolute positioning and apply the adjusted positions.
      win.style.position = 'absolute';
      win.style.left = (originalLeft + deltaLeft) + 'px';
      win.style.top  = (originalTop + deltaTop) + 'px';
    });
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initRandomizer(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initRandomizer);
}

// Fallback: if markup arrives later, trigger once the clutter container exists
(function ensureRandomizerRuns() {
  let started = false;
  const tryRun = () => {
    if (!started && document.querySelector('.cluttered-desktop-container')) {
      started = true;
      try { initRandomizer(); } catch (_) {}
      observer.disconnect();
    }
  };
  const observer = new MutationObserver(tryRun);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  tryRun();
})();

/* === Makes draggable folders mimic GUI folders === */
function initFolderDrags(root) {
  const isMobile = () => window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;
  const containers = (root ? Array.from(root.querySelectorAll('.folder-grid')) : Array.from(document.querySelectorAll('.folder-grid')));
  if (!root && document.querySelector('.folder-grid')) {
    // also include top-level if root is not provided
    containers.unshift(document.querySelector('.folder-grid'));
  }

  containers.filter(Boolean).forEach((container) => {
    const draggableFolders = container.querySelectorAll('.draggable-folder');

    draggableFolders.forEach(folder => {
    if (isMobile()) return; // disable folder dragging on mobile
    const link = folder.querySelector('a, .link-block');
    let isDragging = false;
    let startX, startY;

    folder.addEventListener('mousedown', function (e) {
      e.preventDefault();
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      const containerRect = container.getBoundingClientRect();
      const folderRect = folder.getBoundingClientRect();

      const offsetX = startX - folderRect.left;
      const offsetY = startY - folderRect.top;

      folder.style.position = 'absolute';
      folder.style.left = (folderRect.left - containerRect.left) + 'px';
      folder.style.top = (folderRect.top - containerRect.top) + 'px';
      folder.style.width = folderRect.width + 'px';
      folder.style.height = folderRect.height + 'px';
      folder.style.zIndex = '9999';

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
        }

        const left = moveEvent.clientX - containerRect.left - offsetX;
        const top = moveEvent.clientY - containerRect.top - offsetY;
        folder.style.left = `${left}px`;
        folder.style.top = `${top}px`;
      };

      const onMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        folder.style.zIndex = '';

        if (isDragging) {
          const preventClick = (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            if (link) link.removeEventListener('click', preventClick, true);
          };
          if (link) link.addEventListener('click', preventClick, true);
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    });

      folder.ondragstart = () => false;
    });
  });
}

// Run now if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFolderDrags());
} else {
  initFolderDrags();
}

// Observe for dynamically added folder grids
const folderObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    m.addedNodes.forEach((n) => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches && n.matches('.folder-grid')) initFolderDrags(n);
      else if (n.querySelectorAll) {
        const grids = n.querySelectorAll('.folder-grid');
        if (grids.length) initFolderDrags(n);
      }
    });
  }
});
folderObserver.observe(document.body, { childList: true, subtree: true });
