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
