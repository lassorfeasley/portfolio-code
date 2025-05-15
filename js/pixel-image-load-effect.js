/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  // Track which images have been processed
  const processedImages = new Set();
  
  // Detect Safari browser
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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
      if (img.complete && img.naturalWidth !== 0) {
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

  // Special handling for Safari
  if (isSafari) {
    // Force all images to load their data first (Safari specific fix)
    const allImages = document.querySelectorAll(".retro-window img");
    let loadedCount = 0;
    const totalImages = allImages.length;
    
    // Function to check when all images are fully loaded
    const checkAllImagesLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        // When all images are loaded, run the visibility check
        setTimeout(checkInitialVisibility, 100);
      }
    };
    
    // Check each image
    allImages.forEach(img => {
      if (img.complete && img.naturalWidth !== 0) {
        checkAllImagesLoaded();
      } else {
        img.addEventListener("load", checkAllImagesLoaded);
        
        // Force load by setting src again for Safari
        const currentSrc = img.src;
        img.src = "";
        setTimeout(() => {
          img.src = currentSrc;
        }, 10);
      }
    });
  } else {
    // For non-Safari browsers, use the original approach
    setTimeout(checkInitialVisibility, 100);
  }

  // Also check on full page load
  window.addEventListener("load", () => {
    setTimeout(checkInitialVisibility, 100);
  });

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
    // Don't prepare if already prepared
    if (img.dataset.canvasId) return;
    
    // Safari may report complete but not actually have loaded the image
    if (isSafari && (!img.complete || img.naturalWidth === 0)) {
      setTimeout(() => prepareInitialPixel(img), 50);
      return;
    }

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
    
    // Safety check for Safari
    if (rect.width <= 0 || rect.height <= 0) {
      if (isSafari) {
        // Try again later
        setTimeout(() => prepareInitialPixel(img), 50);
        return;
      }
    }
    
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

    // Create a unique canvas ID
    const canvasId = "canvas-" + Math.random().toString(36).slice(2);
    img.dataset.canvasId = canvas.id = canvasId;
    
    // Special handling for Safari
    if (isSafari) {
      // Create a temporary image to ensure Safari has fully loaded this image
      const tempImg = new Image();
      tempImg.crossOrigin = img.crossOrigin;
      tempImg.onload = function() {
        drawPixelStep(img, canvas, ctx, steps);
      };
      tempImg.src = img.src;
    } else {
      drawPixelStep(img, canvas, ctx, steps);
    }
  }

  function pixelate(img) {
    const canvas = document.getElementById(img.dataset.canvasId);
    
    // Safety check - if canvas doesn't exist or image is already processed
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Safari-specific checks
    if (isSafari) {
      // Ensure image is fully loaded for Safari
      if (!img.complete || img.naturalWidth === 0) {
        setTimeout(() => pixelate(img), 50);
        return;
      }
      
      // Temporarily make image visible for Safari rendering
      img.style.visibility = "visible";
      
      // Force a repaint in Safari
      canvas.style.display = "none";
      void canvas.offsetHeight; // Force reflow
      canvas.style.display = "block";
    }
    
    // Draw the initial step to ensure something is shown
    drawPixelStep(img, canvas, ctx, steps);
    
    // Hide the image again until animation completes
    if (!isSafari) {
      img.style.visibility = "hidden";
    }

    let currentStep = 0;
    let animationRunning = true;

    function doStep() {
      // Don't continue if animation was interrupted
      if (!animationRunning) return;
      
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
        
        // For Safari, ensure position is set correctly
        if (isSafari) {
          img.style.position = "static";
          img.style.width = "auto";
          img.style.height = "auto";
        } else {
          img.style.position = "static";
        }
        
        // Move image back to original position
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.insertBefore(img, wrapper);
          wrapper.remove();
        }
        
        animationRunning = false;
        return;
      }

      drawPixelStep(img, canvas, ctx, steps - currentStep);
      currentStep++;
      const randomDelay = minStepDelay + Math.floor(Math.random() * maxStepDelay);
      setTimeout(doStep, randomDelay);
    }
    
    // Safari-specific: give a moment before starting animation
    if (isSafari) {
      setTimeout(doStep, 50);
    } else {
      doStep();
    }
    
    // Handle browser visibility change (tab switching)
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) {
        // Page is hidden, pause animation
        animationRunning = false;
      } else if (currentStep <= steps) {
        // Page is visible again and animation wasn't complete
        animationRunning = true;
        doStep();
      }
    });
  }

  function drawPixelStep(img, canvas, ctx, exponent) {
    try {
      const rect = img.getBoundingClientRect();
      
      // Skip if image has no dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        // For Safari, try again later
        if (isSafari && exponent === steps) {
          setTimeout(() => drawPixelStep(img, canvas, ctx, exponent), 50);
        }
        return;
      }
      
      // Ensure canvas dimensions match the image
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = Math.max(1, rect.width);
        canvas.height = Math.max(1, rect.height);
      }
      
      const pixelSize = Math.pow(2, exponent);

      const downCanvas = document.createElement("canvas");
      downCanvas.width = Math.max(1, Math.floor(rect.width / pixelSize));
      downCanvas.height = Math.max(1, Math.floor(rect.height / pixelSize));
      const downCtx = downCanvas.getContext("2d");
      downCtx.imageSmoothingEnabled = false;
      
      // Safari-specific check
      if (isSafari && (!img.complete || img.naturalWidth === 0)) {
        // Try again in a moment
        setTimeout(() => drawPixelStep(img, canvas, ctx, exponent), 50);
        return;
      }
      
      // Make sure image is loaded before drawing
      if (img.complete && img.naturalWidth !== 0) {
        // Force image to be visible for Safari to properly render
        const originalVisibility = img.style.visibility;
        if (isSafari) img.style.visibility = 'visible';
        
        downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
        
        // Restore visibility
        if (isSafari) img.style.visibility = originalVisibility;
      }
    } catch (error) {
      console.error("Error during pixelation:", error);
    }
  }
});