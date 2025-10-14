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
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setupEchoEffect('.retro-window, .draggable-folder');
    }, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initEcho(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initEcho);
}