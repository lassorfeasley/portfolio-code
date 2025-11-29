/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
function initRetroWindowInteractions() {
  // Treat touch/coarse pointers as mobile; disable drag/resize on mobile
  const isMobile = () => window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;
  const setupWindow = (windowEl) => {
    // Skip React-managed windows; those are handled in component code
    if (windowEl && windowEl.dataset && windowEl.dataset.reactManaged === 'true') return;
    if (!windowEl || windowEl.dataset.retroWindowInitialized === 'true') return;
    windowEl.dataset.retroWindowInitialized = 'true';
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
    let lockedWidth = 0;
    let lockedHeight = 0;
    header.addEventListener('mousedown', (e) => {
      if (isMobile()) return; // disable header drag on mobile
      e.preventDefault();
      try { if (typeof window.retroFloatWindow === 'function') window.retroFloatWindow(windowEl); } catch (_) {}
      isDragging = true;
      // Remove breathing shadow and static shadow when dragging starts
      windowEl.classList.remove('breathing-shadow');
      windowEl.classList.add('no-static-shadow');
      bringToFront();

      // Lock current size before taking the element out of normal flow
      const rect = windowEl.getBoundingClientRect();
      lockedWidth = rect.width;
      lockedHeight = rect.height;
      
      // Set position first, then enforce width with !important to override CSS rules
      windowEl.style.position = 'absolute';
      // Use setProperty with important flag to override CSS !important rules
      windowEl.style.setProperty('width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('max-width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('height', `${lockedHeight}px`, 'important');
      windowEl.style.setProperty('max-height', `${lockedHeight}px`, 'important');
      
      const currentLeft = parseInt(windowEl.style.left, 10) || windowEl.offsetLeft;
      const currentTop  = parseInt(windowEl.style.top, 10) || windowEl.offsetTop;
      const canvas = windowEl.closest('.windowcanvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
      // Compute offset in canvas (layer) coordinates
      offsetX = (e.pageX - canvasRect.left) - currentLeft;
      offsetY = (e.pageY - canvasRect.top)  - currentTop;
      windowEl.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      // Re-enforce width/height during drag to prevent CSS from overriding
      windowEl.style.setProperty('width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('max-width', `${lockedWidth}px`, 'important');
      windowEl.style.setProperty('height', `${lockedHeight}px`, 'important');
      windowEl.style.setProperty('max-height', `${lockedHeight}px`, 'important');
      // Clamp drag within its canvas using layer-relative coordinates
      const canvas = windowEl.closest('.windowcanvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      const SAFE_SIDE_PADDING = 16;
      const SAFE_BOTTOM_PADDING = 80;
      const ALLOW_OVERFLOW_X = 100;
      const ALLOW_OVERFLOW_Y = 150;
      const minLeft = -ALLOW_OVERFLOW_X;
      const maxLeft = canvasRect.width - lockedWidth + ALLOW_OVERFLOW_X;
      const minTop = -ALLOW_OVERFLOW_Y;
      const maxTop = canvasRect.height - lockedHeight + Math.max(0, ALLOW_OVERFLOW_Y - SAFE_BOTTOM_PADDING);
      const pointerX = e.pageX - canvasRect.left;
      const pointerY = e.pageY - canvasRect.top;
      const targetLeft = Math.min(maxLeft, Math.max(minLeft, pointerX - offsetX));
      const targetTop  = Math.min(maxTop, Math.max(minTop,  pointerY - offsetY));
      windowEl.style.left = `${targetLeft}px`;
      windowEl.style.top  = `${targetTop}px`;
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        windowEl.style.cursor = 'default';
        windowEl.classList.remove('no-static-shadow');
        // Clear width/height constraints after dragging ends (remove important flag)
        // For width, we must restore the pixel width because the floated element needs it to maintain layout
        windowEl.style.width = `${lockedWidth}px`;
        windowEl.style.removeProperty('max-width');
        windowEl.style.removeProperty('height');
        windowEl.style.removeProperty('max-height');
        // Restore breathing shadow by calling updateBreathingShadow if available
        if (typeof updateBreathingShadow === 'function') {
          try {
            updateBreathingShadow();
          } catch (e) {
            // Silently fail if updateBreathingShadow has issues
          }
        }
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
        if (isMobile()) return; // disable resize on mobile
        e.preventDefault();
        try { if (typeof window.retroFloatWindow === 'function') window.retroFloatWindow(windowEl); } catch (_) {}
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
  };

  // Initialize currently present windows (including those inside project-type lists)
  document.querySelectorAll('.retro-window, .w-dyn-item .retro-window').forEach(setupWindow);

  // Observe for windows added after client-side navigation
  const windowInteractionObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.classList && n.classList.contains('retro-window')) {
          setupWindow(n);
        }
        // Also search within subtree
        n.querySelectorAll && n.querySelectorAll('.retro-window').forEach(setupWindow);
      });
    }
  });
  windowInteractionObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initRetroWindowInteractions(); } catch (e) { console.error(e); }
} else {
  window.addEventListener('load', initRetroWindowInteractions);
}
