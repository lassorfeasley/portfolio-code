/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  const steps = 6;
  const totalTargetDuration = 5000;
  const minStepDelay = 250;
  const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

  // Add ResizeObserver to handle window-content resizing
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const windowContent = entry.target;
      const wrapper = windowContent.querySelector('.pixel-loading-wrapper');
      if (wrapper) {
        const parentWidth = windowContent.offsetWidth;
        const parentHeight = windowContent.offsetHeight;
        wrapper.style.width = parentWidth + "px";
        wrapper.style.height = parentHeight + "px";
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        triggerImagesInWindow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  const retroWindows = document.querySelectorAll(".retro-window");

  retroWindows.forEach(windowEl => {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => {
      // Start observing resize on the window-content parent
      const windowContent = img.closest('.window-content');
      if (windowContent) {
        resizeObserver.observe(windowContent);
      }
      
      if (img.complete) {
        prepareInitialPixel(img);
      } else {
        img.addEventListener("load", () => prepareInitialPixel(img));
      }
    });
    
    // Check if window is already in viewport immediately
    const rect = windowEl.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // Add a small delay to ensure preparation is complete
      setTimeout(() => {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }, 50);
    }
    
    observer.observe(windowEl);
  });

  // Keep the existing load event handler as a fallback
  window.addEventListener("load", () => {
    retroWindows.forEach(windowEl => {
      const rect = windowEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggerImagesInWindow(windowEl);
        observer.unobserve(windowEl);
      }
    });
  });

  function triggerImagesInWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => pixelate(img));
  }

  function prepareInitialPixel(img) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("pixel-loading-wrapper");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";

    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "block";

    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.visibility = "hidden";
    img.style.zIndex = "1";

    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(canvas);
    wrapper.appendChild(img);

    img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);
    drawPixelStep(img, canvas, ctx, steps);
  }

  function pixelate(img) {
    const canvas = document.getElementById(img.dataset.canvasId);
    const ctx = canvas.getContext("2d");
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;
        const originalParent = wrapper.parentElement;
        const windowContent = originalParent.closest('.window-content');
        
        // Reset all styles
        img.style.position = "";
        img.style.top = "";
        img.style.left = "";
        img.style.width = "";
        img.style.height = "";
        img.style.objectFit = "";
        img.style.visibility = "visible";
        img.style.zIndex = "";
        
        // Move the image back to its original position
        originalParent.insertBefore(img, wrapper);
        wrapper.remove();
        
        // Stop observing the window-content when effect is complete
        if (windowContent) {
          resizeObserver.unobserve(windowContent);
        }
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
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const pixelSize = Math.pow(2, exponent);

    const downCanvas = document.createElement("canvas");
    downCanvas.width = w / pixelSize;
    downCanvas.height = h / pixelSize;
    const downCtx = downCanvas.getContext("2d");
    downCtx.imageSmoothingEnabled = false;
    downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(downCanvas, 0, 0, w, h);
  }
});