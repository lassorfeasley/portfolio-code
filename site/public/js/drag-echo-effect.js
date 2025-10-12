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
  document.querySelectorAll(draggableSelector).forEach(draggable => {
    let lastX = null;
    let lastY = null;

    draggable.addEventListener('mousedown', () => {
      lastX = parseInt(draggable.style.left, 10) || draggable.offsetLeft;
      lastY = parseInt(draggable.style.top, 10) || draggable.offsetTop;

      const mouseMoveHandler = () => {
        const currentX = parseInt(draggable.style.left, 10);
        const currentY = parseInt(draggable.style.top, 10);

        const distanceMoved = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));

        if (distanceMoved >= PIXEL_DISTANCE_FOR_ECHO) {
          createEcho(draggable);
          lastX = currentX;
          lastY = currentY;
        }
      };

      document.addEventListener('mousemove', mouseMoveHandler);

      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
      }, { once: true });
    });
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  // Initial attach
  setupEchoEffect('.retro-window, .draggable-folder');

  // Re-attach echoes for windows added later (client-side nav)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches && (n.matches('.retro-window') || n.matches('.draggable-folder'))) {
          setupEchoEffect('.retro-window, .draggable-folder');
        } else if (n.querySelectorAll) {
          const found = n.querySelectorAll('.retro-window, .draggable-folder');
          if (found.length) setupEchoEffect('.retro-window, .draggable-folder');
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});