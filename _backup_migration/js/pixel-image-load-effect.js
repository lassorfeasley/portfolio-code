/* === Makes images load in a pixelated effect === */

(function attachPixelImageEffect() {
  function initPixelImageEffect() {
    if (window.__pixelImageEffectInitialized) {
      return;
    }
    window.__pixelImageEffectInitialized = true;

    const steps = 6;
    const totalTargetDuration = 5000;
    const minStepDelay = 250;
    const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerImagesInWindow(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
    });

    const retroWindows = document.querySelectorAll('.retro-window');

    retroWindows.forEach((windowEl) => {
      const images = windowEl.querySelectorAll('img');
      images.forEach((img) => {
        if (img.complete) {
          prepareInitialPixel(img);
        } else {
          img.addEventListener('load', () => prepareInitialPixel(img));
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

    window.addEventListener('load', () => {
      retroWindows.forEach((windowEl) => {
        const rect = windowEl.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          triggerImagesInWindow(windowEl);
          observer.unobserve(windowEl);
        }
      });
    });

    function triggerImagesInWindow(windowEl) {
      windowEl.dataset.animationTriggerActivated = 'true'; // Mark the window as ready for animations
      const images = windowEl.querySelectorAll('img');
      images.forEach((img) => {
        if (img.dataset.canvasId) {
          pixelate(img);
        }
      });
    }

    async function prepareInitialPixel(img) {
      // Prevent double-init
      if (img.dataset.canvasId) return;

      // 1. Ensure image data is ready to prevent blank canvas
      if ('decode' in img) {
        try {
          await img.decode();
        } catch (e) {
          // console.warn("Image decode failed", e);
        }
      }
      if (img.dataset.canvasId) return;

      // 2. Setup Canvas as a Sibling Overlay (Avoids layout shifts from wrapping)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Ensure parent is positioned so we can place canvas relative to it
      const parent = img.parentElement;
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.position === 'static') {
        parent.style.position = 'relative';
      }

      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10'; // Ensure on top of image
      
      // Initial sizing/positioning
      updateCanvasPosition(img, canvas);

      // Insert canvas
      if (img.nextSibling) {
        parent.insertBefore(canvas, img.nextSibling);
      } else {
        parent.appendChild(canvas);
      }

      img.dataset.canvasId = canvas.id = `canvas-${Math.random().toString(36).slice(2)}`;
      
      // 3. Start Animation Loop
      requestAnimationFrame(() => {
        drawPixelStep(img, canvas, ctx, steps);
        
        // If window is already active, start animation
        const parentWindow = img.closest('.retro-window');
        if (parentWindow && parentWindow.dataset.animationTriggerActivated === 'true') {
            pixelate(img);
        }
      });
    }

    function updateCanvasPosition(img, canvas) {
        canvas.style.left = `${img.offsetLeft}px`;
        canvas.style.top = `${img.offsetTop}px`;
        canvas.style.width = `${img.offsetWidth}px`;
        canvas.style.height = `${img.offsetHeight}px`;
        
        // Update buffer size if needed
        if (canvas.width !== img.offsetWidth || canvas.height !== img.offsetHeight) {
             canvas.width = Math.max(1, img.offsetWidth);
             canvas.height = Math.max(1, img.offsetHeight);
        }
    }

    function pixelate(img) {
      if (!img.dataset.canvasId) return;
      const canvas = document.getElementById(img.dataset.canvasId);
      if (!canvas) return;

      if (img.dataset.animationFinished === 'true') return;
      if (img.dataset.animationStarted === 'true') return;
      img.dataset.animationStarted = 'true';

      const ctx = canvas.getContext('2d');
      let currentStep = 0;

      function doStep() {
        if (currentStep > steps) {
          // Cleanup
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          delete img.dataset.animationStarted;
          img.dataset.animationFinished = 'true';
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
      // Sync position/size in case of layout shifts during animation
      updateCanvasPosition(img, canvas);

      const width = canvas.width;
      const height = canvas.height;
      const pixelSize = Math.max(1, Math.pow(2, exponent));
      
      // Create temp canvas for pixelation
      const downCanvas = document.createElement('canvas');
      downCanvas.width = Math.max(1, Math.floor(width / pixelSize));
      downCanvas.height = Math.max(1, Math.floor(height / pixelSize));
      const downCtx = downCanvas.getContext('2d');
      downCtx.imageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;

      try {
        // Handle object-fit: cover/contain simulation
        const computed = window.getComputedStyle(img);
        const objectFit = computed.objectFit;
        
        if (objectFit === 'cover' || objectFit === 'contain') {
           // Calculate aspect ratios
           const imgRatio = img.naturalWidth / img.naturalHeight;
           const canvasRatio = width / height;
           
           let sx, sy, sw, sh;
           
           if (objectFit === 'cover') {
               if (imgRatio > canvasRatio) {
                   sh = img.naturalHeight;
                   sw = sh * canvasRatio;
                   sy = 0;
                   sx = (img.naturalWidth - sw) / 2;
               } else {
                   sw = img.naturalWidth;
                   sh = sw / canvasRatio;
                   sx = 0;
                   sy = (img.naturalHeight - sh) / 2;
               }
           } else { // contain
               if (imgRatio > canvasRatio) {
                   sw = img.naturalWidth;
                   sh = sw / canvasRatio;
                   sx = 0;
                   sy = (img.naturalHeight - sh) / 2;
               } else {
                   sh = img.naturalHeight;
                   sw = sh * canvasRatio;
                   sy = 0;
                   sx = (img.naturalWidth - sw) / 2;
               }
           }
           
           // Draw cropped/fitted image to downCanvas (pixelate)
           downCtx.drawImage(img, sx, sy, sw, sh, 0, 0, downCanvas.width, downCanvas.height);
        } else {
           // Default: stretch (fill)
           downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);
        }

        // Draw pixelated result to main canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(downCanvas, 0, 0, width, height);
      } catch (e) {
        // console.error("Pixel effect draw error:", e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPixelImageEffect, { once: true });
  } else {
    initPixelImageEffect();
  }
})();
