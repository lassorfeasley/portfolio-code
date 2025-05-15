/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
window.addEventListener('load', () => {
  // ————————————————————————————————
  // 1) Set up windowCanvas elements
  // ————————————————————————————————
  document.querySelectorAll('.windowCanvas').forEach(canvas => {
    const initH = canvas.getBoundingClientRect().height;
    
    // Set all the styles at once to avoid reflow
    Object.assign(canvas.style, {
      height: `${initH}px`,
      position: 'relative',
      overflow: 'visible',
      flexShrink: '0',
      flexGrow: '0',
      boxSizing: 'border-box'
    });

    // Create a height-locking style element
    const style = document.createElement('style');
    style.textContent = `
      .windowCanvas {
        min-height: ${initH}px !important;
        max-height: ${initH}px !important;
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
  });

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

    // Ensure window is positioned absolutely
    windowEl.style.position = 'absolute';

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
      };
      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
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