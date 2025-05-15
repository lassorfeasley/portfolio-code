/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
window.addEventListener('load', () => {
  // ——————————————————————————————————————————————————————
  // Lock in the canvas’s initial height so it never shrinks
  // ——————————————————————————————————————————————————————
  const canvas = document.getElementById('windowCanvas');
  if (canvas) {
    const initH = canvas.getBoundingClientRect().height;
    canvas.style.height    = `${initH}px`;
    canvas.style.overflowY = 'auto';  // allow scrolling if children grow taller
  }

  // Now initialize each retro window…
  document.querySelectorAll('.retro-window').forEach(windowEl => {
    // Required and optional elements within the window.
    const header    = windowEl.querySelector('.window-bar');
    const closeBtn  = windowEl.querySelector('.x-out');
    const resizer   = windowEl.querySelector('.resize-corner');
    const contentEl = windowEl.querySelector('.window-content');
    const link      = windowEl.querySelector('a, .link-block');

    if (!header) return; // skip windows without a header

    // ——————————————————————————————
    // Helpers: get and bump z-index
    // ——————————————————————————————
    const getZIndex = el => {
      const z = parseInt(window.getComputedStyle(el).zIndex, 10);
      return isNaN(z) ? 0 : z;
    };
    const bringToFront = () => {
      const all = Array.from(document.querySelectorAll('.retro-window'));
      const max = all.reduce((m, el) => Math.max(m, getZIndex(el)), 0);
      windowEl.style.zIndex = max + 1;
    };

    // ——————————————————————————————
    // Global mousedown: bring forward (unless clicking a link)
    // ——————————————————————————————
    windowEl.addEventListener('mousedown', e => {
      if (!e.target.closest('a, .link-block')) {
        bringToFront();
      }
    }, true);

    // ——————————————————————————————
    // Drag-to-move via header
    // ——————————————————————————————
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
      e.preventDefault();
      isDragging = true;
      bringToFront();

      const curLeft = parseInt(windowEl.style.left, 10) || windowEl.offsetLeft;
      const curTop  = parseInt(windowEl.style.top, 10)  || windowEl.offsetTop;
      offsetX = e.pageX - curLeft;
      offsetY = e.pageY - curTop;
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

    // ——————————————————————————————
    // Close button
    // ——————————————————————————————
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        windowEl.style.display = 'none';
      });
    }

    // ——————————————————————————————
    // Resize via corner drag
    // ——————————————————————————————
    if (resizer) {
      let isResizing = false,
          startX, startY,
          startW, startH;

      resizer.addEventListener('mousedown', e => {
        e.preventDefault();
        isResizing = true;
        bringToFront();

        startX = e.pageX;
        startY = e.pageY;
        startW = parseInt(window.getComputedStyle(windowEl).width, 10);
        startH = parseInt(window.getComputedStyle(windowEl).height, 10);

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });

      const doResize = e => {
        if (!isResizing) return;
        const newW = Math.max(200, startW + (e.pageX - startX));
        const newH = Math.max(100, startH + (e.pageY - startY));
        windowEl.style.width  = `${newW}px`;
        windowEl.style.height = `${newH}px`;
        if (contentEl) {
          contentEl.style.maxWidth  = `${newW}px`;
          contentEl.style.maxHeight = `${newH}px`;
        }
      };

      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }

    // ——————————————————————————————
    // Two-click link activation: first click brings to front
    // ——————————————————————————————
    if (link) {
      link.addEventListener('click', e => {
        const all = Array.from(document.querySelectorAll('.retro-window'));
        const max = all.reduce((m, el) => Math.max(m, getZIndex(el)), 0);
        const thisZ = getZIndex(windowEl);
        if (thisZ < max) {
          e.preventDefault();
          e.stopPropagation();
          bringToFront();
          console.log('Brought to front — click again to follow link.');
        }
      });
    }
  });
});
