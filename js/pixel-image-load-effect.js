/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  // Animation configuration
  const steps = 6;
  const stepDuration = 250; // ms per step
  const maxRandomDelay = 300; // max additional random delay per step

  // Keep track of processed images to avoid duplicates
  const processedImages = new Set();
  
  // Create intersection observer to detect when windows enter viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          processRetroWindow(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { 
      threshold: 0.1,
      rootMargin: "200px 0px" // Preload images slightly before they enter viewport
    }
  );

  // Find and prepare all retro windows
  function initializeRetroWindows() {
    const retroWindows = document.querySelectorAll(".retro-window");
    
    retroWindows.forEach(window => {
      // Check if already in viewport
      const rect = window.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Already visible, process immediately
        processRetroWindow(window);
      } else {
        // Not visible yet, observe for when it comes into view
        observer.observe(window);
      }
    });
  }

  // Process a retro window and start animations for its images
  function processRetroWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    
    images.forEach(img => {
      // Skip if already processed
      if (processedImages.has(img)) return;
      processedImages.add(img);
      
      // Start or schedule the animation
      if (img.complete && img.naturalWidth > 0) {
        startPixelAnimation(img);
      } else {
        img.addEventListener("load", () => startPixelAnimation(img));
      }
    });
  }

  // Start the pixelation animation for an image
  function startPixelAnimation(img) {
    // Create and configure the canvas element
    const canvas = document.createElement("canvas");
    const width = img.offsetWidth;
    const height = img.offsetHeight;
    
    // Skip if image has no dimensions
    if (width <= 0 || height <= 0) return;
    
    // Configure canvas
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "2";
    
    // Create wrapper for positioning
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = width + "px";
    wrapper.style.height = height + "px";
    
    // Add elements to DOM
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);
    
    // Store original image styles
    const originalStyles = {
      position: img.style.position,
      width: img.style.width,
      height: img.style.height
    };
    
    // Position image
    img.style.position = "absolute";
    img.style.width = "100%";
    img.style.height = "100%";
    
    // Run animation
    runAnimation(img, canvas, originalStyles);
  }
  
  // Run the pixelation animation
  function runAnimation(img, canvas, originalStyles) {
    const ctx = canvas.getContext("2d");
    let currentStep = 0;
    
    // Animation step function
    function animationStep() {
      if (currentStep > steps) {
        // Animation completed, restore original image
        canvas.remove();
        Object.assign(img.style, originalStyles);
        return;
      }
      
      // Calculate pixelation level for this step
      const pixelSize = Math.pow(2, steps - currentStep);
      
      try {
        // Create a smaller canvas for the pixelated effect
        const smallCanvas = document.createElement("canvas");
        const smallCtx = smallCanvas.getContext("2d");
        
        // Calculate dimensions
        smallCanvas.width = Math.max(1, Math.floor(canvas.width / pixelSize));
        smallCanvas.height = Math.max(1, Math.floor(canvas.height / pixelSize));
        
        // Disable image smoothing for pixelated effect
        smallCtx.imageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        
        // Draw image at reduced size
        smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
        
        // Scale back up to create pixelated effect
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(smallCanvas, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.warn("Error during animation step", e);
      }
      
      // Schedule next animation step with slight random delay
      currentStep++;
      const delay = stepDuration + Math.floor(Math.random() * maxRandomDelay);
      setTimeout(animationStep, delay);
    }
    
    // Start animation
    animationStep();
  }

  // Initialize after a short delay to ensure DOM is ready
  setTimeout(initializeRetroWindows, 50);
  
  // Reinitialize on page load to catch any missed images
  window.addEventListener("load", initializeRetroWindows);
  
  // Reinitialize on resize to catch newly visible elements
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initializeRetroWindows, 200);
  });
});