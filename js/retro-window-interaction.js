/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
window.addEventListener('load', () => {
  // ————————————————————————————————
  // 1) Function to lock canvas heights
  // ————————————————————————————————
  const lockCanvasHeights = () => {
    document.querySelectorAll('.windowCanvas').forEach(canvas => {
      // Get the current computed height
      const computedStyle = window.getComputedStyle(canvas);
      const initH = canvas.getBoundingClientRect().height;
      
      // Force absolute positioning and sizing
      canvas.style.position = 'relative';     // Ensure proper positioning context
      canvas.style.overflow = 'visible';      // Allow windows to be visible outside
      canvas.style.height = `${initH}px`;
      canvas.style.minHeight = `${initH}px`;
      canvas.style.maxHeight = `${initH}px`;
      canvas.style.flexShrink = '0';
      canvas.style.flexGrow = '0';
      canvas.style.boxSizing = 'border-box';  // Ensure padding doesn't affect size
    });
  };

  // Initial height lock
  lockCanvasHeights();

  // ————————————————————————————————
  // 2) The retro-window logic
  // ————————————————————————————————
  document.querySelectorAll('.retro-window').forEach(windowEl => {
    const header    = windowEl.querySelector('.window-bar');
    const closeBtn  = windowEl.querySelector('.x-out');
    const resizer   = windowEl.querySelector('.resize-corner');
    const contentEl = windowEl.querySelector('.window-content');
    const link      = windowEl.querySelector('a, .link-block');
    if (!header) return;

    const getZIndex = el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      return isNaN(z) ? 0 : z;
    };
    const bringToFront = () => {
      const all = Array.from(document.querySelectorAll('.retro-window'));
      const max = all.reduce((m, el) => Math.max(m, getZIndex(el)), 0);
      windowEl.style.zIndex = max + 1;
    };

    // global mousedown
    windowEl.addEventListener('mousedown', e => {
      if (!e.target.closest('a, .link-block')) bringToFront();
    }, true);

    // drag
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
      e.preventDefault();
      isDragging = true;
      bringToFront();
      const curL = parseInt(windowEl.style.left, 10) || windowEl.offsetLeft;
      const curT = parseInt(windowEl.style.top, 10)  || windowEl.offsetTop;
      offsetX = e.pageX - curL;
      offsetY = e.pageY - curT;
      windowEl.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      windowEl.style.left = `${e.pageX - offsetX}px`;
      windowEl.style.top  = `${e.pageY - offsetY}px`;
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        windowEl.style.cursor = 'default';
      }
    });

    // close
    if (closeBtn) closeBtn.addEventListener('click', () => {
      windowEl.style.display = 'none';
      // Relock heights after window is closed
      setTimeout(lockCanvasHeights, 0);
    });

    // resize
    if (resizer) {
      let isResizing = false, startX, startY, startW, startH;
      resizer.addEventListener('mousedown', e => {
        e.preventDefault();
        isResizing = true;
        bringToFront();
        startX = e.pageX; startY = e.pageY;
        startW = parseInt(getComputedStyle(windowEl).width, 10);
        startH = parseInt(getComputedStyle(windowEl).height, 10);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
      const doResize = e => {
        if (!isResizing) return;
        const w = Math.max(200, startW + (e.pageX - startX));
        const h = Math.max(100, startH + (e.pageY - startY));
        windowEl.style.width  = `${w}px`;
        windowEl.style.height = `${h}px`;
        if (contentEl) {
          contentEl.style.maxWidth  = `${w}px`;
          contentEl.style.maxHeight = `${h}px`;
        }
        // Relock heights during resize
        lockCanvasHeights();
      };
      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        // Final height lock after resize
        setTimeout(lockCanvasHeights, 0);
      };
    }

    // two-click links
    if (link) {
      link.addEventListener('click', e => {
        const all = Array.from(document.querySelectorAll('.retro-window'));
        const max = all.reduce((m, el) => Math.max(m, getZIndex(el)), 0);
        if (getZIndex(windowEl) < max) {
          e.preventDefault();
          e.stopPropagation();
          bringToFront();
          console.log('👉 Brought to front—click again to activate link.');
        }
      });
    }
  });
});