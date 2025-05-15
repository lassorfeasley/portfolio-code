/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  // Animation configuration
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  // Track processed images to avoid duplicates
  const processedImages = new WeakSet();

  // Create intersection observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains("retro-window")) {
          triggerImagesInWindow(entry.target);
        } else if (entry.target.tagName === "IMG") {
          // Direct image target (likely lightbox thumbnail)
          if (!processedImages.has(entry.target)) {
            prepareInitialPixel(entry.target);
            pixelate(entry.target);
          }
        }
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "100px 0px"
  });

  // Find all retro windows
  const retroWindows = document.querySelectorAll(".retro-window");
  
  // Find potential lightbox thumbnails
  const lightboxThumbnails = document.querySelectorAll("a[rel*='lightbox'] img, img.lightbox, .w-lightbox img");

  // Process retro windows
  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (img.complete && !processedImages.has(img)) {
        prepareInitialPixel(img);
      } else if (!processedImages.has(img)) {
        img.addEventListener("load", () => {
          if (!processedImages.has(img)) {
            prepareInitialPixel(img);
          }
        });
      }
    });
    
    // Check if window is already in viewport
    const rect = windowEl.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => {
        triggerImagesInWindow(windowEl);
      }, 50);
    } else {
      observer.observe(windowEl);
    }
  });
  
  // Process lightbox thumbnails
  lightboxThumbnails.forEach(img => {
    if (processedImages.has(img)) return;
    
    if (img.complete) {
      prepareInitialPixel(img);
      
      const rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setTimeout(() => pixelate(img), 50);
      } else {
        observer.observe(img);
      }
    } else {
      img.addEventListener("load", () => {
        if (!processedImages.has(img)) {
          prepareInitialPixel(img);
          
          const rect = img.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            pixelate(img);
          } else {
            observer.observe(img);
          }
        }
      });
    }
  });

  // Check on full page load for any missed images
  window.addEventListener("load", () => {
    retroWindows.forEach(windowEl => {
      const rect = windowEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggerImagesInWindow(windowEl);
      }
    });
    
    lightboxThumbnails.forEach(img => {
      if (!processedImages.has(img)) {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (!img.dataset.canvasId) {
            prepareInitialPixel(img);
          }
          pixelate(img);
        }
      }
    });
  });

  function triggerImagesInWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (img.dataset.canvasId && !processedImages.has(img)) {
        pixelate(img);
      }
    });
  }

  function prepareInitialPixel(img) {
    // Skip if already prepared or too small
    if (img.dataset.canvasId || processedImages.has(img)) return;
    if (img.offsetWidth < 20 || img.offsetHeight < 20) return;
    
    processedImages.add(img);
    
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

    // Set canvas size to match displayed image size
    const rect = img.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width);
    canvas.height = Math.max(1, rect.height);
    
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = rect.width + "px";
    wrapper.style.height = rect.height + "px";

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
    drawPixelStep(img, canvas, ctx, steps);
  }

  function pixelate(img) {
    const canvas = document.getElementById(img.dataset.canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        
        // Restore original styles
        const originalStyles = JSON.parse(img.dataset.originalStyles || '{}');
        Object.entries(originalStyles).forEach(([prop, value]) => {
          img.style[prop] = value;
        });
        
        img.style.visibility = "visible";
        img.style.position = "static";
        
        // Move image back to original position
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();
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
    try {
      const pixelSize = Math.pow(2, exponent);

      const downCanvas = document.createElement("canvas");
      downCanvas.width = Math.max(1, Math.floor(canvas.width / pixelSize));
      downCanvas.height = Math.max(1, Math.floor(canvas.height / pixelSize));
      const downCtx = downCanvas.getContext("2d");
      downCtx.imageSmoothingEnabled = false;
      
      downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.warn("Pixelation error:", error);
    }
  }
});