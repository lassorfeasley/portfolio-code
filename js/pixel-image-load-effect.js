/* === Makes images load in a pixelated effect === */

document.addEventListener("DOMContentLoaded", () => {
  // Animation configuration
  const steps = 6;
  const stepDuration = 250; // ms per step
  const maxRandomDelay = 300; // max additional random delay per step

  // Keep track of processed images to avoid duplicates
  const processedImages = new Set();
  
  // Create intersection observer to detect when elements enter viewport
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains("retro-window")) {
            processRetroWindow(entry.target);
          } else if (entry.target.tagName === "IMG") {
            // Handle individual images (like lightbox thumbnails)
            if (!processedImages.has(entry.target)) {
              startPixelAnimation(entry.target);
            }
          }
          intersectionObserver.unobserve(entry.target);
        }
      });
    },
    { 
      threshold: 0.1,
      rootMargin: "200px 0px" // Preload images slightly before they enter viewport
    }
  );

  // Find and prepare all retro windows and lightbox thumbnails
  function initializeEffects() {
    // Process retro windows
    const retroWindows = document.querySelectorAll(".retro-window");
    retroWindows.forEach(window => {
      // Check if already in viewport
      const rect = window.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Already visible, process immediately
        processRetroWindow(window);
      } else {
        // Not visible yet, observe for when it comes into view
        intersectionObserver.observe(window);
      }
    });
    
    // Process Webflow lightbox thumbnails
    // Webflow uses various classes for lightboxes including .w-lightbox
    const webflowLightboxSelectors = [
      ".w-lightbox img",                 // Standard Webflow lightbox
      "[data-ix=lightbox] img",          // Webflow IX trigger
      ".w-dyn-item a[href$='.jpg'] img", // Dynamic items with image links
      ".w-dyn-item a[href$='.png'] img", 
      ".w-dyn-item a[href$='.jpeg'] img",
      ".w-dyn-item a[href$='.gif'] img",
      ".w-dyn-item a[href$='.webp'] img",
      // Additional common Webflow lightbox implementations
      "[data-lightbox] img", 
      ".lightbox-link img",
      ".lightbox img"
    ];
    
    const lightboxThumbnails = document.querySelectorAll(webflowLightboxSelectors.join(", "));
    lightboxThumbnails.forEach(img => {
      if (processedImages.has(img)) return;
      
      // Skip Webflow's own thumbnail image placeholders
      if (img.classList.contains("w-lightbox-thumbnail")) return;
      
      // Skip SVG images which don't work well with canvas
      if (img.src && (img.src.endsWith('.svg') || img.src.includes('data:image/svg+xml'))) return;
      
      const rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0) {
        // Already visible, process immediately
        startPixelAnimation(img);
      } else {
        // Not visible yet, observe for when it comes into view
        intersectionObserver.observe(img);
      }
    });
  }

  // Process a retro window and start animations for its images
  function processRetroWindow(windowEl) {
    const images = windowEl.querySelectorAll("img");
    
    images.forEach(img => {
      // Skip if already processed
      if (processedImages.has(img)) return;
      
      // Skip SVG images which don't work well with canvas
      if (img.src && (img.src.endsWith('.svg') || img.src.includes('data:image/svg+xml'))) return;
      
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
    // Skip if already processed
    if (processedImages.has(img)) return;
    processedImages.add(img);
    
    // Skip if image is too small (might be a placeholder)
    const minDimension = 30;
    if (img.offsetWidth < minDimension || img.offsetHeight < minDimension) return;
    
    // Skip if image is hidden or has no display
    const style = window.getComputedStyle(img);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    
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
    
    // Preserve Webflow classes if they exist
    if (img.className) {
      const classes = img.className.split(' ').filter(c => !c.startsWith('w-') && c !== 'img');
      if (classes.length > 0) {
        wrapper.className = classes.join(' ');
      }
    }
    
    // Add elements to DOM
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(canvas);
    
    // Store original image styles
    const originalStyles = {
      position: img.style.position,
      width: img.style.width,
      height: img.style.height,
      zIndex: img.style.zIndex
    };
    
    // Position image
    img.style.position = "absolute";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.zIndex = "1"; // Ensure the image is below the canvas
    
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
        if (canvas.parentNode) {
          canvas.remove();
          Object.assign(img.style, originalStyles);
        }
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
        
        // Make sure image is still valid before drawing
        if (img.complete && img.naturalWidth > 0) {
          // Draw image at reduced size
          smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
          
          // Scale back up to create pixelated effect
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(smallCanvas, 0, 0, canvas.width, canvas.height);
        }
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
  setTimeout(initializeEffects, 50);
  
  // Reinitialize on page load to catch any missed images
  window.addEventListener("load", initializeEffects);
  
  // Reinitialize on resize to catch newly visible elements
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initializeEffects, 200);
  });
  
  // Handle dynamically added content (Webflow can load content dynamically)
  const mutationObserver = new MutationObserver((mutations) => {
    let shouldRecheck = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look specifically for Webflow dynamic content
        const hasDynamicContent = Array.from(mutation.addedNodes).some(node => {
          return node.nodeType === 1 && (
            node.classList?.contains('w-dyn-item') ||
            node.classList?.contains('w-lightbox') ||
            node.querySelector?.('.w-dyn-item, .w-lightbox, img')
          );
        });
        
        if (hasDynamicContent) {
          shouldRecheck = true;
        }
      }
    });
    
    if (shouldRecheck) {
      setTimeout(initializeEffects, 100);
    }
  });
  
  mutationObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Listen for Webflow's page transition events if present
  if (window.Webflow && window.Webflow.push) {
    window.Webflow.push(() => {
      window.Webflow.scroll.on('scroll', initializeEffects);
    });
  }
});