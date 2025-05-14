function prepareInitialPixel(img) {
  // Store original styles
  const originalStyles = {
      width: img.style.width,
      height: img.style.height,
      position: img.style.position,
      display: img.style.display
  };
  img.dataset.originalStyles = JSON.stringify(originalStyles);

  // Create a wrapper that inherits the image's natural dimensions and any CSS constraints
  const wrapper = document.createElement("div");
  wrapper.classList.add("pixel-loading-wrapper");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";
  wrapper.style.maxWidth = "100%"; // Ensure wrapper respects container constraints
  
  // Position image first to get correct dimensions
  img.parentNode.insertBefore(wrapper, img);
  wrapper.appendChild(img);
  
  // Now get dimensions after image is in final position
  const rect = img.getBoundingClientRect();
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas size to match displayed image size
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "2";
  canvas.style.pointerEvents = "none";

  // Position image
  img.style.position = "absolute";
  img.style.top = "0";
  img.style.left = "0";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.visibility = "hidden";
  img.style.maxWidth = "100%"; // Ensure image respects container constraints

  wrapper.appendChild(canvas);
  wrapper.style.width = rect.width + "px";
  wrapper.style.height = rect.height + "px";

  img.dataset.canvasId = canvas.id = "canvas-" + Math.random().toString(36).slice(2);
  drawPixelStep(img, canvas, ctx, steps);
}