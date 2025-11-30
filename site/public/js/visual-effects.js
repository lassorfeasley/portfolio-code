/* === BUNDLE: visual-effects.js === */
/* Combined: breathing-shadow-apply.js, drag-echo-effect.js, pixel-image-load-effect.js, window-randomizer.js, drag-and-drop-icons.js */

/* === Causes active window to have a breathing shadow effect (the effect is stored in webflow) === */

// Function: Find window with highest z-index
function findTopWindow(windows) {
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
  const windows = document.querySelectorAll('.retro-window');
  const topWindow = findTopWindow(windows);

  windows.forEach(win => {
    win.classList.toggle('breathing-shadow', win === topWindow);
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  updateBreathingShadow();

  // Re-check frequently in case z-index changes dynamically
  setInterval(updateBreathingShadow, 500);
});

// Optional: Immediate update when window is clicked
document.querySelectorAll('.retro-window').forEach(win => {
  win.addEventListener('mousedown', () => {
    setTimeout(updateBreathingShadow, 10);
  });
});

/* === Causes a 'drag echo' effect when dragging elements === */

// === Easy-to-configure variables ===
const PIXEL_DISTANCE_FOR_ECHO = 10;   // How many pixels movement before leaving an echo
const ECHO_DURATION_MS = 2000;        // How long each echo lasts (milliseconds)
const MAX_ECHOS = 500;                // Maximum number of echoes visible at once
const ECHO_OPACITY = 1;               // Opacity of each echo
const ECHO_BLUR = '0px';              // Blur applied to echoes (CSS blur)

// Echo management
let echos = [];

function createEcho(el) {
  // Clone the original element
  const echo = el.cloneNode(true);

  // Get computed style to preserve visual appearance
  const style = window.getComputedStyle(el);

  // Set basic styling for the echo
  echo.style.position = 'absolute';
  echo.style.pointerEvents = 'none';
  echo.style.margin = '0';
  // Use getBoundingClientRect for more accurate position relative to viewport,
  // but we need it relative to offset parent.
  // For simplicty, stick to style.left/top if available, otherwise offsetLeft/Top
  echo.style.left = el.style.left;
  echo.style.top = el.style.top;
  echo.style.width = style.width;
  echo.style.height = style.height;
  echo.style.opacity = ECHO_OPACITY;
  echo.style.filter = `blur(${ECHO_BLUR})`;
  // Ensure echo is behind
  const z = parseInt(style.zIndex || 0, 10);
  echo.style.zIndex = isNaN(z) ? -1 : z - 1;

  // Add echo to DOM
  if (el.parentElement) {
      el.parentElement.appendChild(echo);
      echos.push(echo);
  }

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
  const elements = document.querySelectorAll(draggableSelector);
  
  elements.forEach(draggable => {
    // Avoid double-binding if run multiple times
    if (draggable.dataset.echoAttached === 'true') return;
    draggable.dataset.echoAttached = 'true';

    let lastX = null;
    let lastY = null;

    draggable.addEventListener('mousedown', (e) => {
      // Only left click
      if (e.button !== 0) return;

      // Remove breathing shadow and static shadow when dragging starts
      draggable.classList.remove('breathing-shadow');
      draggable.classList.add('no-static-shadow');
      
      // Capture initial position
      lastX = parseInt(draggable.style.left, 10) || draggable.offsetLeft;
      lastY = parseInt(draggable.style.top, 10) || draggable.offsetTop;

      const mouseMoveHandler = (moveEvent) => {
        // For Safari/React interop, we might be reading values before the style updates.
        // We can use the mouse position delta if the element style isn't updating fast enough,
        // but ideally we read the element's actual position.
        
        // Use getBoundingClientRect for truth, then convert to offset-relative if possible?
        // Actually, checking style.left is usually fine if the drag handler is updating it.
        // But if it's a transform drag (unlikely here), we need to check transform.
        
        const currentX = parseInt(draggable.style.left, 10) || draggable.offsetLeft;
        const currentY = parseInt(draggable.style.top, 10) || draggable.offsetTop;

        const dx = currentX - lastX;
        const dy = currentY - lastY;
        const distanceMoved = Math.sqrt(dx*dx + dy*dy);

        if (distanceMoved >= PIXEL_DISTANCE_FOR_ECHO) {
          createEcho(draggable);
          lastX = currentX;
          lastY = currentY;
        }
      };

      document.addEventListener('mousemove', mouseMoveHandler);

      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        
        // Restore shadows when dragging ends
        draggable.classList.remove('no-static-shadow');
        
        // Restore breathing shadow by calling updateBreathingShadow if available
        if (typeof window.updateBreathingShadow === 'function') {
          try {
            window.updateBreathingShadow();
          } catch (e) {
            // Silently fail
          }
        }
      }, { once: true });
    });
  });
}

// Initialize on page load
function initEcho() {
    // Adjust selectors to match your draggable elements
    setupEchoEffect('.retro-window, .draggable-folder');

    // Observe DOM changes so dynamically injected windows also get the echo behavior (SPA navigation)
    if (!window.__echoObserverAttached) {
      const target = document.querySelector('.public-body') || document.body;
      if (target) {
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
              setupEchoEffect('.retro-window, .draggable-folder');
              break;
            }
          }
        });
        observer.observe(target, { childList: true, subtree: true });
        window.__echoObserverAttached = true;
      }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEcho);
} else {
    initEcho();
}
window.addEventListener('load', initEcho);


(function attachPixelImageEffect() {
  function initPixelImageEffect() {
    if (window.__pixelImageEffectInitialized) {
      return;
    }
    window.__pixelImageEffectInitialized = true;

    const steps = 6;
    const totalTargetDuration = 5000;
    const minStepDelay = 250;
    const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerImagesInWindow(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
    });

    // Function to process images in a window
    function processWindowImages(windowEl) {
      const images = windowEl.querySelectorAll('img');
      images.forEach((img) => {
        // Skip if already processed
        if (img.dataset.canvasId) return;
        // Skip if image has no dimensions yet (not rendered)
        if (img.offsetWidth === 0 && img.offsetHeight === 0) {
          // Wait for image to get dimensions
          const checkDimensions = () => {
            if (img.offsetWidth > 0 || img.offsetHeight > 0) {
              prepareInitialPixel(img);
            } else {
              requestAnimationFrame(checkDimensions);
            }
          };
          requestAnimationFrame(checkDimensions);
          return;
        }
        if (img.complete) {
          prepareInitialPixel(img);
        } else {
          img.addEventListener('load', () => prepareInitialPixel(img), { once: true });
        }
      });
    }

    const retroWindows = document.querySelectorAll('.retro-window');

    retroWindows.forEach((windowEl) => {
      processWindowImages(windowEl);

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

    window.addEventListener('load', () => {
      retroWindows.forEach((windowEl) => {
        const rect = windowEl.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          triggerImagesInWindow(windowEl);
          observer.unobserve(windowEl);
        }
      });
    });

    function triggerImagesInWindow(windowEl) {
      windowEl.dataset.animationTriggerActivated = 'true'; // Mark the window as ready for animations
      const images = windowEl.querySelectorAll('img');
      images.forEach((img) => {
        if (img.dataset.canvasId) {
          pixelate(img);
        }
      });
    }

    async function prepareInitialPixel(img) {
      if (img.dataset.canvasId) return;

      // Attempt to ensure image is ready, but don't block endlessly
      if ('decode' in img) {
        try {
          await img.decode();
        } catch (e) {
          // console.warn("Image decode failed or not needed", e);
        }
      }
      if (img.dataset.canvasId) return;

      // Setup Canvas as a Sibling Overlay
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Ensure parent is positioned so we can place canvas relative to it
      const parent = img.parentElement;
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.position === 'static') {
        parent.style.position = 'relative';
      }

      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';
      // Safeguard: ensure canvas never exceeds parent bounds, preventing overflow flashes
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      
      // Initial sizing/positioning
      updateCanvasPosition(img, canvas);

      // Insert canvas
      if (img.nextSibling) {
        parent.insertBefore(canvas, img.nextSibling);
      } else {
        parent.appendChild(canvas);
      }

      img.dataset.canvasId = canvas.id = `canvas-${Math.random().toString(36).slice(2)}`;
      
      // Use ResizeObserver for robust size tracking instead of just polling in draw loop
      let resizeObserver = null;
      if (typeof ResizeObserver !== 'undefined') {
        try {
          resizeObserver = new ResizeObserver(() => {
            updateCanvasPosition(img, canvas);
            // Redraw immediately on resize to avoid lag
            const currentStep = parseInt(img.dataset.currentPixelStep || '0', 10);
            if (currentStep <= steps) { // Only if animation not finished
                 // We need to access 'doStep' context or just wait for next frame.
                 // Simpler: do nothing, the animation loop handles it.
                 // But if animation finished? We remove canvas anyway.
            }
          });
          resizeObserver.observe(img);
          // Store observer on image so pixelate() can access it later
          img._pixelResizeObserver = resizeObserver;
        } catch (e) {
          // ResizeObserver failed, continue without it
        }
      }

      // Start Animation Loop
      requestAnimationFrame(() => {
        drawPixelStep(img, canvas, ctx, steps);
        
        const parentWindow = img.closest('.retro-window');
        if (parentWindow && parentWindow.dataset.animationTriggerActivated === 'true') {
            pixelate(img);
        }
      });
    }

    function updateCanvasPosition(img, canvas) {
        // Match image position/size
        canvas.style.left = `${img.offsetLeft}px`;
        canvas.style.top = `${img.offsetTop}px`;
        canvas.style.width = `${img.offsetWidth}px`;
        canvas.style.height = `${img.offsetHeight}px`;
        
        // Update buffer size if needed (resolution)
        if (canvas.width !== img.offsetWidth || canvas.height !== img.offsetHeight) {
             // Prevent 0x0 canvas
             canvas.width = Math.max(1, img.offsetWidth);
             canvas.height = Math.max(1, img.offsetHeight);
        }
    }

    function pixelate(img) {
      if (!img.dataset.canvasId) return;
      const canvas = document.getElementById(img.dataset.canvasId);
      if (!canvas) return;

      if (img.dataset.animationFinished === 'true') return;
      if (img.dataset.animationStarted === 'true') return;
      img.dataset.animationStarted = 'true';

      // Retrieve resizeObserver from image if available
      const resizeObserver = img._pixelResizeObserver;

      const ctx = canvas.getContext('2d');
      let currentStep = 0;

      function doStep() {
        img.dataset.currentPixelStep = currentStep;
        if (currentStep > steps) {
          // Cleanup
          if (resizeObserver) resizeObserver.disconnect();
          delete img._pixelResizeObserver;
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          delete img.dataset.animationStarted;
          delete img.dataset.currentPixelStep;
          img.dataset.animationFinished = 'true';
          return;
        }

        drawPixelStep(img, canvas, ctx, steps - currentStep);
        currentStep++;
        const randomDelay = minStepDelay + Math.floor(Math.random() * maxStepDelay);
        setTimeout(doStep, randomDelay);
      }

      doStep();
    }

    function drawPixelStep(img, canvas, ctx, exponent) {
      // Sync position/size in case of layout shifts during animation
      updateCanvasPosition(img, canvas);

      const width = canvas.width;
      const height = canvas.height;
      const pixelSize = Math.max(1, Math.pow(2, exponent));
      
      const downCanvas = document.createElement('canvas');
      downCanvas.width = Math.max(1, Math.floor(width / pixelSize));
      downCanvas.height = Math.max(1, Math.floor(height / pixelSize));
      const downCtx = downCanvas.getContext('2d');
      
      downCtx.imageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;

      try {
        // Handle object-fit
        const computed = window.getComputedStyle(img);
        const objectFit = computed.objectFit;
        
        if (objectFit === 'cover' || objectFit === 'contain') {
           const imgRatio = img.naturalWidth / img.naturalHeight;
           const canvasRatio = width / height;
           let sx, sy, sw, sh;
           
           if (objectFit === 'cover') {
               if (imgRatio > canvasRatio) {
                   sh = img.naturalHeight;
                   sw = sh * canvasRatio;
                   sy = 0;
                   sx = (img.naturalWidth - sw) / 2;
               } else {
                   sw = img.naturalWidth;
                   sh = sw / canvasRatio;
                   sx = 0;
                   sy = (img.naturalHeight - sh) / 2;
               }
           } else { // contain
               if (imgRatio > canvasRatio) {
                   sw = img.naturalWidth;
                   sh = sw / canvasRatio;
                   sx = 0;
                   sy = (img.naturalHeight - sh) / 2;
               } else {
                   sh = img.naturalHeight;
                   sw = sh * canvasRatio;
                   sy = 0;
                   sx = (img.naturalWidth - sw) / 2;
               }
           }
           downCtx.drawImage(img, sx, sy, sw, sh, 0, 0, downCanvas.width, downCanvas.height);
        } else {
           downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(downCanvas, 0, 0, width, height);
      } catch (e) {}
    }
  }

  // Initialize immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPixelImageEffect, { once: true });
  } else {
    // DOM already loaded, but wait a tick to ensure all scripts/styles are applied
    setTimeout(initPixelImageEffect, 0);
  }
  
  // Also re-run on window load to catch any images that loaded late
  window.addEventListener('load', () => {
    if (!window.__pixelImageEffectInitialized) {
      initPixelImageEffect();
    }
    // Note: IntersectionObserver handles dynamically added content automatically
  });
})();

/* === Causes retro windows to be randomly positioned and  on the screen === */
function applyScatterEffect() {
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
  const affectedCanvases = new Set();

  clutteredContainers.forEach(container => {
    // Ensure the container stays in place:
    // 1. Set its position to relative (to serve as positioning context)
    // 2. Lock in its height so that it won't collapse when children are set to absolute.
    container.style.position = 'relative';
    // Only lock height if not already locked, to avoid re-locking on re-runs
    if (!container.style.height) {
       container.style.height = container.offsetHeight + 'px';
    }

    // Select all retro windows that belong to this container.
    // They might be inside placeholders (docked) or in the float layer (floated).
    const placeholders = container.querySelectorAll('.retro-window-placeholder');
    const windows = [];

    placeholders.forEach(ph => {
      // 1. Try to find window inside placeholder (not floated yet)
      let win = ph.querySelector('.retro-window');
      
      // 2. If not found, check if it's floated
      if (!win && ph.dataset.floatId) {
        const canvas = ph.closest('.windowcanvas');
        if (canvas) {
          const layer = canvas.querySelector('.window-float-layer');
          if (layer) {
             win = layer.querySelector(`.retro-window[data-float-id="${ph.dataset.floatId}"], .retro-window[data-floatId="${ph.dataset.floatId}"]`);
          }
        }
      }
      
      if (win) windows.push(win);
    });
    
    // Fallback: if no placeholders found (legacy structure?), try direct query
    if (placeholders.length === 0) {
       const directWindows = container.querySelectorAll('.retro-window');
       directWindows.forEach(w => windows.push(w));
    }

    // Utility function to generate a random offset in the range [-max, max]
    const randomOffset = (max) => (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * (max + 1));

    // Filter out windows that have already been randomized to prevent re-jumping
    const newWindows = windows.filter(win => win.dataset.scatterRandomized !== 'true');

    newWindows.forEach(win => {
      // Mark as randomized so we don't move it again
      win.dataset.scatterRandomized = 'true';

      // 1. Randomize width between MIN_WIDTH and MAX_WIDTH.
      const randomWidth = Math.floor(Math.random() * (MAX_WIDTH - MIN_WIDTH + 1)) + MIN_WIDTH;

      // 2. Randomize the z-index between 1 and 500.
      const randomZIndex = Math.floor(Math.random() * 500) + 1;

      // 3. Calculate random horizontal and vertical offsets.
      const deltaLeft = randomOffset(MAX_HORIZONTAL_SCATTER);
      const deltaTop  = randomOffset(MAX_VERTICAL_SCATTER);

      // 4. Apply scatter values to dataset for core-effects.js to pick up
      win.dataset.scatterX = deltaLeft;
      win.dataset.scatterY = deltaTop;
      win.dataset.scatterWidth = randomWidth;
      win.dataset.scatterZ = randomZIndex;

      const canvas = win.closest('.windowcanvas');
      if (canvas) affectedCanvases.add(canvas);
    });
  });

  // Trigger grid mode update to apply the scatter effects
  if (typeof window.retroSetGridModeFor === 'function') {
    affectedCanvases.forEach(canvas => {
      window.retroSetGridModeFor(canvas, false);
    });
  } else if (typeof window.retroSetGridMode === 'function') {
     window.retroSetGridMode(false);
  }
}

// Expose function globally so React can call it
if (typeof window !== 'undefined') {
  window.retroApplyScatterEffect = applyScatterEffect;
}

// Run on initial load
window.addEventListener('load', () => {
  // Delay slightly to ensure DOM is ready
  setTimeout(applyScatterEffect, 100);
});
