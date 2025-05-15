/* === Makes retro windows interactive: move, resize, close — now detached from their windowCanvas so the canvas size never changes === */

window.addEventListener('load', () => {
  // ──────────────────────────────────────────────
  // Give every .windowCanvas an id for reference
  // ──────────────────────────────────────────────
  document.querySelectorAll('.windowCanvas').forEach((canvas, i) => {
    if (!canvas.id) canvas.id = `windowCanvas-${i+1}`;
    // lock its height so it never collapses
    const h = canvas.getBoundingClientRect().height;
    Object.assign(canvas.style, {
      position: 'relative',
      overflow: 'visible',
      minHeight: `${h}px`,
      maxHeight: `${h}px`  // keep fixed
    });
  });

  // ──────────────────────────────────────────────
  // Retro‑window logic (detached to <body>)
  // ──────────────────────────────────────────────
  document.querySelectorAll('.retro-window').forEach(windowEl => {
    // Remember which canvas it came from
    const parentCanvas = windowEl.closest('.windowCanvas');
    if (parentCanvas) {
      windowEl.dataset.originCanvas = parentCanvas.id;
    }

    // Move window to the end of <body> so its containing‑block is viewport
    document.body.appendChild(windowEl);
    windowEl.style.position = 'absolute';

    const header    = windowEl.querySelector('.window-bar');
    const closeBtn  = windowEl.querySelector('.x-out');
    const resizer   = windowEl.querySelector('.resize-corner');
    const contentEl = windowEl.querySelector('.window-content');

    const zOf = el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      return isNaN(z) ? 0 : z;
    };
    const bringToFront = () => {
      const max = Array.from(document.querySelectorAll('.retro-window'))
                    .reduce((m, el) => Math.max(m, zOf(el)), 0);
      windowEl.style.zIndex = max + 1;
    };

    // click anywhere (except links) to focus
    windowEl.addEventListener('mousedown', e => {
      if (!e.target.closest('a, .link-block')) bringToFront();
    }, true);

    // ─── Dragging ────────────────────────────────
    if (header) {
      let dragging = false, offX = 0, offY = 0;
      header.addEventListener('mousedown', e => {
        e.preventDefault();
        dragging = true;
        bringToFront();
        const rect = windowEl.getBoundingClientRect();
        offX = e.pageX - rect.left;
        offY = e.pageY - rect.top;
        windowEl.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', e => {
        if (!dragging) return;
        windowEl.style.left = `${e.pageX - offX}px`;
        windowEl.style.top  = `${e.pageY - offY}px`;
      });
      document.addEventListener('mouseup', () => {
        dragging = false;
        windowEl.style.cursor = 'default';
      });
    }

    // ─── Close button ────────────────────────────
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        windowEl.style.display = 'none';
      });
    }

    // ─── Resizing ───────────────────────────────
    if (resizer) {
      let resizing = false, sx, sy, sw, sh;
      resizer.addEventListener('mousedown', e => {
        e.preventDefault();
        resizing = true;
        bringToFront();
        sx = e.pageX; sy = e.pageY;
        const rect = windowEl.getBoundingClientRect();
        sw = rect.width; sh = rect.height;
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      });
      const doResize = e => {
        if (!resizing) return;
        const w = Math.max(200, sw + (e.pageX - sx));
        const h = Math.max(100, sh + (e.pageY - sy));
        windowEl.style.width  = `${w}px`;
        windowEl.style.height = `${h}px`;
        if (contentEl) {
          contentEl.style.maxWidth  = `${w}px`;
          contentEl.style.maxHeight = `${h}px`;
        }
      };
      const stopResize = () => {
        resizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
      };
    }

    // ─── Two‑click links (keep behaviour) ───────
    const link = windowEl.querySelector('a, .link-block');
    if (link) {
      link.addEventListener('click', e => {
        const max = Array.from(document.querySelectorAll('.retro-window'))
                       .reduce((m, el) => Math.max(m, zOf(el)), 0);
        if (zOf(windowEl) < max) {
          e.preventDefault();
          e.stopPropagation();
          bringToFront();
          console.log('👉 Brought to front—click again to activate link.');
        }
      });
    }
  });
});
