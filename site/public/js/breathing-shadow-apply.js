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
function initBreathingShadow() {
  updateBreathingShadow();
  setInterval(updateBreathingShadow, 500);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initBreathingShadow(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initBreathingShadow);
}

// Optional: Immediate update when window is clicked
document.querySelectorAll('.retro-window').forEach(win => {
  win.addEventListener('mousedown', () => {
    setTimeout(updateBreathingShadow, 10);
  });
});