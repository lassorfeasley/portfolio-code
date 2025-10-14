/* === Makes images load in a pixelated effect === */

function initPixelImageLoadEffect() {
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  function getDisplayedSize(img) {
    const rect = img.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    if (!w || !h) {
      if (img.naturalWidth && img.naturalHeight) {
        w = img.naturalWidth;
        h = img.naturalHeight;
      } else if (img.parentElement) {
        const pr = img.parentElement.getBoundingClientRect();
        w = pr.width || 1;
        h = pr.height || 1;
      } else {
        w = 1; h = 1;
      }
    }
    return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        triggerImagesInWindow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  const retroWindows = document.querySelectorAll(".retro-window");

  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (img.complete) {
        prepareInitialPixel(img);
      } else {
        img.addEventListener("load", () => prepareInitialPixel(img));
      }
    });
    
    // Check if window is already in viewport immediately
    const rect = windowEl.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }, 50);
    }
    
    observer.observe(windowEl);
  });

  window.addEventListener("load", () => {
    retroWindows.forEach(windowEl => {
      const rect = windowEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }
    });
  });

  // Observe dynamically-added windows so their images pixelate
  const dynObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        const windows = n.matches && n.matches('.retro-window')
          ? [n]
          : (n.querySelectorAll ? Array.from(n.querySelectorAll('.retro-window')) : []);
        windows.forEach((w) => {
          // Prepare and observe new window
          const imgs = w.querySelectorAll('img');
          imgs.forEach((img) => {
            if (img.complete) {
              prepareInitialPixel(img);
            } else {
              img.addEventListener('load', () => prepareInitialPixel(img));
            }
          });
          observer.observe(w);
        });

        // Also handle any images added anywhere in the DOM
        const addedImages = (n.matches && n.matches('img'))
          ? [n]
          : (n.querySelectorAll ? Array.from(n.querySelectorAll('img')) : []);
        addedImages.forEach((img) => {
          if (img.dataset.canvasId) return; // already prepared
          if (img.complete) {
            prepareInitialPixel(img);
            if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
          } else {
            img.addEventListener('load', () => {
              if (img.dataset.canvasId) return;
              prepareInitialPixel(img);
              if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
            });
          }
        });
      });
    });
  });
  dynObserver.observe(document.body, { childList: true, subtree: true });

  // Fallback: pixelate images that are not inside .retro-window across all pages
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      imgObserver.unobserve(img);
      // ensure prepared
      if (!img.dataset.canvasId) prepareInitialPixel(img);
      pixelate(img);
    });
  }, { threshold: 0.1, rootMargin: '100px' });

  const allImages = Array.from(document.querySelectorAll('img'));
  allImages.forEach((img) => {
    if (img.dataset.canvasId) return;
    if (img.complete) {
      prepareInitialPixel(img);
      if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
    } else {
      img.addEventListener('load', () => {
        if (img.dataset.canvasId) return;
        prepareInitialPixel(img);
        if (isInViewport(img)) pixelate(img); else imgObserver.observe(img);
      });
    }
  });

  function triggerImagesInWindow(windowEl) {
    windowEl.dataset.animationTriggerActivated = "true"; // Mark the window as ready for animations
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      // Only attempt to pixelate if the image has been prepared (canvasId exists)
      // and its parent window is now marked as activated.
      // pixelate() itself has guards against re-animating.
      if (img.dataset.canvasId) {
        pixelate(img);
      }
      // If canvasId is not set yet, prepareInitialPixel will handle calling pixelate
      // for this image once it's ready, because windowEl.dataset.animationTriggerActivated is now true.
    });
  }

  function prepareInitialPixel(img) {
    // Store original styles
    const originalStyles = {
      width: img.style.width,
      height: img.style.height,
      position: img.style.position,
      display: img.style.display
    };
    img.dataset.originalStyles = JSON.stringify(originalStyles);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match displayed image size (robust on mobile)
    const size = getDisplayedSize(img);
    canvas.width = size.width;
    canvas.height = size.height;
    
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.classList.add("pixel-loading-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = size.width + "px";
    wrapper.style.height = size.height + "px";

    // Position image
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.visibility = "hidden";

    // Set up DOM structure
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);

    img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);
    drawPixelStep(img, canvas, ctx, steps); // Draw initial highly pixelated state

    // Check if the parent window is already activated for animations
    const parentWindow = img.closest('.retro-window');
    if (parentWindow && parentWindow.dataset.animationTriggerActivated === "true") {
      // If so, and the canvas is ready (which it is at this point), trigger animation for this image.
      // pixelate() has its own guards to prevent re-animation if already started/finished.
      pixelate(img);
    }
  }

  function pixelate(img) {
    if (!img.dataset.canvasId) {
      // console.warn("pixelate: canvasId not set for image:", img.src, ". Image may not be loaded/prepared yet.");
      return;
    }
    const canvas = document.getElementById(img.dataset.canvasId);
    if (!canvas) {
      // console.error("Pixelate: Canvas element not found for ID:", img.dataset.canvasId, "for image:", img.src);
      return;
    }

    if (img.dataset.animationFinished === "true") {
      return; // Animation already completed
    }
    if (img.dataset.animationStarted === "true") {
      return; // Animation already in progress
    }
    img.dataset.animationStarted = "true";

    const ctx = canvas.getContext("2d");

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;

        // Restore original styles
        const originalStyles = JSON.parse(img.dataset.originalStyles || '{}');
        Object.entries(originalStyles).forEach(([prop, value]) => {
          img.style[prop] = value;
        });

        img.style.visibility = "visible";
        // img.style.position = "static"; // This line is removed as originalStyles should handle position restoration.

        // Move image back to original position
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();

        delete img.dataset.animationStarted;
        img.dataset.animationFinished = "true";
        return;
      }

      drawPixelStep(img, canvas, ctx, steps - currentStep);
      currentStep++;
      const randomDelay = minStepDelay + Math.floor(Math.random() * maxStepDelay);
      setTimeout(doStep, randomDelay);
    }

    doStep();
  }

  function drawPixelStep(img, canvas, ctx, exponent) {
    const pixelSize = Math.pow(2, exponent);

    const downCanvas = document.createElement("canvas");
    downCanvas.width = Math.max(1, Math.round(canvas.width / pixelSize));
    downCanvas.height = Math.max(1, Math.round(canvas.height / pixelSize));
    const downCtx = downCanvas.getContext("2d");
    downCtx.imageSmoothingEnabled = false;
    downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
  }

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  try { initPixelImageLoadEffect(); } catch (e) { console.error(e); }
} else {
  document.addEventListener('DOMContentLoaded', initPixelImageLoadEffect);
}