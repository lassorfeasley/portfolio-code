/* === Makes retro windows interactive, with a close button, resizer, and link click handler === */
window.addEventListener('load', () => {
  // ————————————————————————————————
  // 1) Find the canvas element - Webflow component version
  // ————————————————————————————————
  console.log('🔍 Searching for windowCanvas element...');
  
  // Try multiple selector strategies
  const canvasSelectors = [
    '[class*="windowCanvas"]',
    '[class*="window-canvas"]',
    '[class*="WindowCanvas"]',
    '.windowCanvas',
    '#windowCanvas'
  ];
  
  let canvas = null;
  for (const selector of canvasSelectors) {
    const found = document.querySelector(selector);
    if (found) {
      console.log('✅ Found canvas with selector:', selector);
      canvas = found;
      break;
    }
  }

  // If still not found, try finding by the component structure
  if (!canvas) {
    console.log('⚠️ Trying alternative component structure search...');
    const possibleCanvas = document.querySelector('.retro-window-placeholder').parentElement;
    if (possibleCanvas) {
      console.log('✅ Found canvas through component structure');
      canvas = possibleCanvas;
    }
  }

  if (canvas) {
    console.log('📐 Canvas element found:', canvas);
    console.log('Classes:', canvas.className);
    
    // ————————————————————————————————
    // 2) Delay one tick so CSS/layout is final
    // ————————————————————————————————
    setTimeout(() => {
      // 3) Measure its height and lock it in
      const initH = canvas.getBoundingClientRect().height;
      console.log('🔒 Locking canvas height at', initH, 'px for', canvas);
      canvas.style.height = `${initH}px`;          // Set exact height
      canvas.style.minHeight = `${initH}px`;       // Prevent shrinking
      canvas.style.maxHeight = `${initH}px`;       // Prevent growing
      canvas.style.overflowY = 'auto';             // allow scrolling if content grows taller
      canvas.style.flexShrink = '0';               // if inside a flex container, don't let it shrink
      canvas.style.flexGrow = '0';                 // prevent growing in flex containers
      canvas.style.position = 'relative';          // ensure positioning context
    }, 0);
  } else {
    console.warn('⚠️ No windowCanvas element found with any selector');
    console.log('Available elements with similar classes:', 
      Array.from(document.querySelectorAll('[class*="window"]'))
        .map(el => ({element: el.tagName, classes: el.className}))
    );
  }

  // ————————————————————————————————
  // 4) The rest of your retro-window logic…
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