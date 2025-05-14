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

  window.addEventListener("resize", debounce(() => {
    document.querySelectorAll(".pixel-loading-wrapper").forEach(wrapper => {
      const img = wrapper.querySelector("img");
      const canvas = wrapper.querySelector("canvas");
      const ctx = canvas.getContext("2d");
      const rect = img.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      wrapper.style.width = rect.width + "px";
      wrapper.style.height = rect.height + "px";

      drawPixelStep(img, canvas, ctx, steps);
    });
  }, 150));

  function debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function triggerImagesInWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    images.forEach(img => pixelate(img));
  }

  function prepareInitialPixel(img) {
    const computedStyles = getComputedStyle(img);
    const originalStyles = {
      width: computedStyles.width,
      height: computedStyles.height,
      position: computedStyles.position,
      display: computedStyles.display
    };
    img.dataset.originalStyles = JSON.stringify(originalStyles);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "2";
    canvas.style.pointerEvents = "none";
    canvas.style.objectFit = computedStyles.objectFit || "cover";
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    const wrapper = document.createElement("div");
    wrapper.classList.add("pixel-loading-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.overflow = "hidden";
    wrapper.style.width = rect.width + "px";
    wrapper.style.height = rect.height + "px";

    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.visibility = "hidden";

    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);

    img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);
    drawPixelStep(img, canvas, ctx, steps);
  }

  function pixelate(img) {
    const canvas = document.getElementById(img.dataset.canvasId);
    const ctx = canvas.getContext("2d");

    let currentStep = 0;

    function doStep() {
      if (currentStep > steps) {
        const wrapper = canvas.parentElement;

        const originalStyles = JSON.parse(img.dataset.originalStyles || '{}');
        Object.entries(originalStyles).forEach(([prop, value]) => {
          img.style[prop] = value;
        });

        img.style.visibility = "visible";
        img.style.position = "";
        img.style.width = "";
        img.style.height = "";

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
    const rect = img.getBoundingClientRect();
    const pixelSize = Math.pow(2, exponent);

    const downCanvas = document.createElement("canvas");
    downCanvas.width = rect.width / pixelSize;
    downCanvas.height = rect.height / pixelSize;
    const downCtx = downCanvas.getContext("2d");
    downCtx.imageSmoothingEnabled = false;
    downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(downCanvas, 0, 0, canvas.width, canvas.height);
  }
});
