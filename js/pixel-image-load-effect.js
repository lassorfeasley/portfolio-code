/* === Makes images load in a pixelated effect === */

  document.addEventListener("DOMContentLoaded", () => {
    const steps = 6;
    const totalTargetDuration = 5000;
    const minStepDelay = 250;
    const maxStepDelay = Math.max(0, (totalTargetDuration - steps * minStepDelay) / steps);

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
        if (img.complete) {
          prepareInitialPixel(img);
        } else {
          img.addEventListener("load", () => prepareInitialPixel(img));
        }
      });
      observer.observe(windowEl);
    });

    // ✅ Safari fix: manually check which windows are in view on load
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
      canvas.style.height = "auto";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "2";
      canvas.style.pointerEvents = "none";

      wrapper.style.width = img.offsetWidth + "px";
      wrapper.style.height = img.offsetHeight + "px";
      wrapper.style.position = "relative";
      wrapper.style.overflow = "hidden";
      wrapper.style.display = "inline-block";

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
          canvas.remove();
          img.style.visibility = "visible";
          img.style.position = "relative";
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