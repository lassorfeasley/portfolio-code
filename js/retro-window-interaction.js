/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
window.addEventListener('load', () => {
  document.querySelectorAll('.retro-window').forEach(windowEl => {
    // Required and optional elements within the window.
    const header    = windowEl.querySelector('.window-bar');
    const closeBtn  = windowEl.querySelector('.x-out');
    const resizer   = windowEl.querySelector('.resize-corner');
    const contentEl = windowEl.querySelector('.window-content');
    const link      = windowEl.querySelector('a, .link-block');

    // If no header, skip this window.
    if (!header) return;

    // ---------------------------------------------------
    // Helper: Get computed z-index
    // ---------------------------------------------------
    const getZIndex = (el) => {
      const z = parseInt(window.getComputedStyle(el).zIndex, 10);
      return isNaN(z) ? 0 : z;
    };

    // ---------------------------------------------------
    // Bring-to-Front Helper
    // ---------------------------------------------------
    const bringToFront = () => {
      const allWindows = Array.from(document.querySelectorAll('.retro-window'));
      const maxZ = allWindows.reduce((max, el) => Math.max(max, getZIndex(el)), 0);
      windowEl.style.zIndex = maxZ + 1;
    };

    // ---------------------------------------------------
    // Global Mouse Down: Bring window to front if the click is NOT on a link.
    // ---------------------------------------------------
    windowEl.addEventListener('mousedown', (e) => {
      // If the click target is a link (or inside one), do nothing. Let the link handler manage it.
      if (!e.target.closest('a, .link-block')) {
        bringToFront();
      }
    }, true);

    // ---------------------------------------------------
    // DRAG FUNCTIONALITY: Header Drag to Move and Bring Window Forward.
    // ---------------------------------------------------
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      bringToFront();

      const currentLeft = parseInt(windowEl.style.left, 10) || windowEl.offsetLeft;
      const currentTop  = parseInt(windowEl.style.top, 10) || windowEl.offsetTop;
      offsetX = e.pageX - currentLeft;
      offsetY = e.pageY - currentTop;
      windowEl.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
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

    // ---------------------------------------------------
    // CLOSE BUTTON FUNCTIONALITY
    // ---------------------------------------------------
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        windowEl.style.display = 'none';
      });
    }

    // ---------------------------------------------------
    // RESIZE FUNCTIONALITY
    // ---------------------------------------------------
    if (resizer) {
      let isResizing = false;
      let startX, startY, startWidth, startHeight;

      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        bringToFront();

        startX = e.pageX;
        startY = e.pageY;
        startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
        startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });

      const doResize = (e) => {
        if (!isResizing) return;
        const newWidth = Math.max(200, startWidth + (e.pageX - startX));
        const newHeight = Math.max(100, startHeight + (e.pageY - startY));
        windowEl.style.width = `${newWidth}px`;
        windowEl.style.height = `${newHeight}px`;

        if (contentEl) {
          contentEl.style.maxWidth = `${newWidth}px`;
          contentEl.style.maxHeight = `${newHeight}px`;
        }
      };

      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }

    // ---------------------------------------------------
    // LINK CLICK HANDLER: Two-Click Activation
    // ---------------------------------------------------
    if (link) {
      link.addEventListener('click', (e) => {
        const allWindows = Array.from(document.querySelectorAll('.retro-window'));
        const maxZ = allWindows.reduce((max, el) => Math.max(max, getZIndex(el)), 0);
        const thisZ = getZIndex(windowEl);

        // If this window is not the top window, prevent the link activation.
        if (thisZ < maxZ) {
          e.preventDefault();
          e.stopPropagation();
          bringToFront();
          console.log("Window was behind: First click brings it to front. Click again to activate the link.");
        }
      });
    }
  });
});