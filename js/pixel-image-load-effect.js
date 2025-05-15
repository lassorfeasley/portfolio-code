/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  // Track which images have been processed
  const processedImages = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        triggerImagesInWindow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    // Add rootMargin to start loading images slightly before they enter the viewport
    // and to catch images above the viewport
    rootMargin: "100% 0px 100% 0px"
  });

  const retroWindows = document.querySelectorAll(".retro-window");

  // Process all images immediately to ensure preparation
  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      if (img.complete) {
        prepareInitialPixel(img);
      } else {
        img.addEventListener("load", () => prepareInitialPixel(img));
      }
    });
  });

  // Separate function to handle initial visibility detection
  function checkInitialVisibility() {
    retroWindows.forEach(windowEl => {
      const rect = windowEl.getBoundingClientRect();
      // Process any elements that are above or within the viewport
      if (rect.bottom > 0) {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      } else {
        // For elements below the viewport, observe them
        observer.observe(windowEl);
      }
    });
  }

  // Run initial check after a short delay to ensure all images are prepared
  setTimeout(checkInitialVisibility, 100);

  // Also check on full page load
  window.addEventListener("load", checkInitialVisibility);

  function triggerImagesInWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      // Only animate images that have been prepared and not already processed
      if (img.dataset.canvasId && !processedImages.has(img.dataset.canvasId)) {
        pixelate(img);
        processedImages.add(img.dataset.canvasId);
      }
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

    // Set canvas size to match displayed image size
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
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
    
    // Safety check - if canvas doesn't exist or image is already processed
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Make sure image is visible for proper rendering
    img.style.visibility = "visible";
    
    // Draw the initial step to ensure something is shown
    drawPixelStep(img, canvas, ctx, steps);
    
    // Then hide the image again until animation completes
    img.style.visibility = "hidden";

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;
        
        // Safety check
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
      const rect = img.getBoundingClientRect();
      
      // Skip if image has no dimensions
      if (rect.width <= 0 || rect.height <= 0) return;
      
      // Ensure canvas dimensions match the image
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      
      const pixelSize = Math.pow(2, exponent);

      const downCanvas = document.createElement("canvas");
      downCanvas.width = Math.max(1, rect.width / pixelSize);
      downCanvas.height = Math.max(1, rect.height / pixelSize);
      const downCtx = downCanvas.getContext("2d");
      downCtx.imageSmoothingEnabled = false;
      
      // Make sure image is loaded before drawing
      if (img.complete) {
        downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
      }
    } catch (error) {
      console.error("Error during pixelation:", error);
    }
  }
});