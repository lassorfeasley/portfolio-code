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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEcho);
} else {
    initEcho();
}
window.addEventListener('load', initEcho);
