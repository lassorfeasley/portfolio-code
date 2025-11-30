/* === Lock windowcanvas dimensions to prevent reflow when windows are moved/resized === */
function lockWindowCanvasDimensions() {
  const canvases = document.querySelectorAll('.windowcanvas');
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    canvases.forEach(canvas => {
      if (canvas.dataset.dimensionsLocked === 'true') return;
      
      // Use offsetHeight instead of getBoundingClientRect for better performance
      const currentHeight = canvas.offsetHeight;
      
      if (currentHeight > 0) {
        canvas.style.minHeight = `${currentHeight}px`;
        canvas.dataset.dimensionsLocked = 'true';
      }
    });
  });
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Run when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(lockWindowCanvasDimensions, 100);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(lockWindowCanvasDimensions, 100);
  });
}

window.addEventListener('load', () => {
  setTimeout(lockWindowCanvasDimensions, 100);
});

// Debounced observer
const debouncedLock = debounce(lockWindowCanvasDimensions, 300);

const canvasLockObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if ((node.classList && node.classList.contains('windowcanvas')) ||
          (node.querySelectorAll && node.querySelectorAll('.windowcanvas').length > 0)) {
        debouncedLock();
        return; // Exit early once we find a match
      }
    }
  }
});

canvasLockObserver.observe(document.body, { childList: true, subtree: true });

