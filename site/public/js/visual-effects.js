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


/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        triggerImagesInWindow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  const retroWindows = document.querySelectorAll(".retro-window");

  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (img.complete) {
        prepareInitialPixel(img);
      } else {
        img.addEventListener("load", () => prepareInitialPixel(img));
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

  function triggerImagesInWindow(windowEl) {
    windowEl.dataset.animationTriggerActivated = "true"; // Mark the window as ready for animations
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
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
    // Store original styles
    const originalStyles = {
      width: img.style.width,
      height: img.style.height,
      position: img.style.position,
      display: img.style.display
    };
    img.dataset.originalStyles = JSON.stringify(originalStyles);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match displayed image size
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.classList.add("pixel-loading-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = rect.width + "px";
    wrapper.style.height = rect.height + "px";

    // Position image
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.visibility = "hidden";

    // Set up DOM structure
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);

    img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);
    drawPixelStep(img, canvas, ctx, steps); // Draw initial highly pixelated state

    // Check if the parent window is already activated for animations
    const parentWindow = img.closest('.retro-window');
    if (parentWindow && parentWindow.dataset.animationTriggerActivated === "true") {
      // If so, and the canvas is ready (which it is at this point), trigger animation for this image.
      // pixelate() has its own guards to prevent re-animation if already started/finished.
      pixelate(img);
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

    const ctx = canvas.getContext("2d");

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;

        // Restore original styles
        const originalStyles = JSON.parse(img.dataset.originalStyles || '{}');
        Object.entries(originalStyles).forEach(([prop, value]) => {
          img.style[prop] = value;
        });

        img.style.visibility = "visible";
        // img.style.position = "static"; // This line is removed as originalStyles should handle position restoration.

        // Move image back to original position
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();

        delete img.dataset.animationStarted;
        img.dataset.animationFinished = "true";
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
    const rect = img.getBoundingClientRect();
    const pixelSize = Math.pow(2, exponent);

    const downCanvas = document.createElement("canvas");
    downCanvas.width = rect.width / pixelSize;
    downCanvas.height = rect.height / pixelSize;
    const downCtx = downCanvas.getContext("2d");
    downCtx.imageSmoothingEnabled = false;
    downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
  }
});

/* === Causes retro windows to be randomly positioned and  on the screen === */
window.addEventListener('load', () => {
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
});


/* === Makes draggable folders mimic GUI folders === */
function initFolderDrag() {
  const containers = document.querySelectorAll('.folder-grid');
  if (!containers.length) return;

  containers.forEach((container) => {
    const draggableFolders = container.querySelectorAll('.draggable-folder');

    draggableFolders.forEach(folder => {
      if (!folder || folder.dataset.folderDragAttached === 'true') return;
      folder.dataset.folderDragAttached = 'true';
      const link = folder.querySelector('a, .link-block');
      let isDragging = false;
      let startX, startY;

      // Use click capture to prevent navigation if we just dragged
      if (link) {
        link.addEventListener('click', (e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      }

      folder.addEventListener('mousedown', function (e) {
        // Only start drag on left click
        if (e.button !== 0) return;
        
        e.preventDefault();
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const containerRect = container.getBoundingClientRect();
        const folderRect = folder.getBoundingClientRect();

        const offsetX = startX - folderRect.left;
        const offsetY = startY - folderRect.top;

        // Promote to absolute ONLY when we actually start dragging
        // But for now, mimic old behavior: immediately absolute on mousedown
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

          // Clamp to container bounds? Or allow free drag?
          // For now, match old logic: free drag relative to container
          const left = moveEvent.clientX - containerRect.left - offsetX;
          const top = moveEvent.clientY - containerRect.top - offsetY;
          folder.style.left = `${left}px`;
          folder.style.top = `${top}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          folder.style.zIndex = '';
          
          // Note: We don't reset position to static/relative, 
          // so it stays dropped where the user left it.
          
          // Reset drag state slightly later to let click handler fire first if needed
          setTimeout(() => {
             isDragging = false;
          }, 50);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp, { once: true });
      });

      folder.ondragstart = () => false;
    });
  });
}

// Run on load and also expose for re-running if needed (e.g. client nav)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFolderDrag);
} else {
  initFolderDrag();
}
// Also try window load to be safe
window.addEventListener('load', initFolderDrag);


