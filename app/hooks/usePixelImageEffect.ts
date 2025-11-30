'use client';

import { useEffect, useRef, useState } from 'react';

interface UsePixelImageEffectOptions {
  enabled?: boolean;
  steps?: number;
  totalDuration?: number;
  minStepDelay?: number;
}

interface UsePixelImageEffectReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isAnimating: boolean;
  isFinished: boolean;
}

const DEFAULT_STEPS = 6;
const DEFAULT_TOTAL_DURATION = 5000;
const DEFAULT_MIN_STEP_DELAY = 250;

/**
 * Hook that applies a pixelation animation effect to an image element.
 * Creates a canvas overlay that progressively reduces pixelation as the image loads.
 */
export function usePixelImageEffect(
  imageRef: React.RefObject<HTMLImageElement | null>,
  options: UsePixelImageEffectOptions = {}
): UsePixelImageEffectReturn {
  const {
    enabled = true,
    steps = DEFAULT_STEPS,
    totalDuration = DEFAULT_TOTAL_DURATION,
    minStepDelay = DEFAULT_MIN_STEP_DELAY,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isInViewportRef = useRef(false);

  // Calculate max step delay
  const maxStepDelay = Math.max(0, (totalDuration - steps * minStepDelay) / steps);

  // Update canvas position and size to match image
  const updateCanvasPosition = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const rect = img.getBoundingClientRect();
    const parent = img.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

    const left = img.offsetLeft || rect.left - parentRect.left;
    const top = img.offsetTop || rect.top - parentRect.top;
    const width = Math.max(1, img.offsetWidth || rect.width || img.naturalWidth || 100);
    const height = Math.max(1, img.offsetHeight || rect.height || img.naturalHeight || 100);

    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Update canvas buffer size
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  // Draw a single pixelation step
  const drawPixelStep = (img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, exponent: number) => {
    if (!canvas.parentElement) return;

    updateCanvasPosition(img, canvas);

    const width = canvas.width;
    const height = canvas.height;
    const pixelSize = Math.max(1, Math.pow(2, exponent));

    // Create temporary canvas for downscaling
    const downCanvas = document.createElement('canvas');
    downCanvas.width = Math.max(1, Math.floor(width / pixelSize));
    downCanvas.height = Math.max(1, Math.floor(height / pixelSize));
    const downCtx = downCanvas.getContext('2d');
    if (!downCtx) return;

    downCtx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    try {
      const computed = window.getComputedStyle(img);
      const objectFit = computed.objectFit;

      if (objectFit === 'cover' || objectFit === 'contain') {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = width / height;
        let sx: number, sy: number, sw: number, sh: number;

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
        } else {
          // contain
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

        downCtx.drawImage(img, sx, sy, sw, sh, 0, 0, downCanvas.width, downCanvas.height);
      } else {
        downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(downCanvas, 0, 0, width, height);
    } catch (e) {
      // Silently handle draw errors
    }
  };

  // Start the pixelation animation
  const startAnimation = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    if (isAnimating || isFinished) return;

    setIsAnimating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsAnimating(false);
      return;
    }

    let currentStep = 0;

    const doStep = () => {
      if (currentStep > steps) {
        // Animation complete - cleanup
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        setIsAnimating(false);
        setIsFinished(true);
        return;
      }

      drawPixelStep(img, canvas, ctx, steps - currentStep);
      currentStep++;

      const randomDelay = minStepDelay + Math.floor(Math.random() * maxStepDelay);
      animationRef.current = window.setTimeout(doStep, randomDelay);
    };

    doStep();
  };

  // Setup canvas and prepare for animation
  const prepareCanvas = async (img: HTMLImageElement) => {
    if (!enabled || !img || isFinished) return;

    // Check if image should be pixelated (opt-out via class)
    if (img.classList?.contains('no-pixelate') || img.closest('.no-pixelate')) {
      return;
    }

    // Ensure image is loaded
    if ('decode' in img && img.naturalWidth === 0) {
      try {
        await Promise.race([
          img.decode(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
        ]);
      } catch (e) {
        // Decode failed or timed out, continue anyway
      }
    }

    if (!img.parentElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure parent is positioned
    const parent = img.parentElement;
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }
    containerRef.current = parent;

    // Setup canvas styling
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.display = 'block';

    // Initial positioning
    updateCanvasPosition(img, canvas);

    // Ensure canvas is in DOM (it should be from the component, but verify)
    if (!canvas.parentElement) {
      if (img.nextSibling) {
        parent.insertBefore(canvas, img.nextSibling);
      } else {
        parent.appendChild(canvas);
      }
    }

    // Setup ResizeObserver for dynamic sizing
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (canvas && img && !isFinished) {
          updateCanvasPosition(img, canvas);
        }
      });
      resizeObserverRef.current.observe(img);
    }

    // Draw initial pixelated state
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawPixelStep(img, canvas, ctx, steps);

        // Start animation if in viewport
        if (isInViewportRef.current) {
          startAnimation(img, canvas);
        }
      }
    });
  };

  // Setup IntersectionObserver for viewport detection
  useEffect(() => {
    if (!enabled || !imageRef.current) return;

    const img = imageRef.current;

    // Check if already in viewport
    const checkViewport = () => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible && !isInViewportRef.current) {
        isInViewportRef.current = true;
        const canvas = canvasRef.current;
        if (canvas && !isAnimating && !isFinished) {
          startAnimation(img, canvas);
        }
      }
    };

    // Setup IntersectionObserver
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInViewportRef.current = true;
            const canvas = canvasRef.current;
            if (canvas && !isAnimating && !isFinished) {
              startAnimation(img, canvas);
            }
            intersectionObserverRef.current?.unobserve(img);
          }
        });
      },
      { threshold: 0.1 }
    );

    intersectionObserverRef.current.observe(img);
    checkViewport();

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [enabled, isAnimating, isFinished]);

  // Setup canvas when image loads
  useEffect(() => {
    console.log('[Pixel Hook] Setup effect running:', {
      enabled,
      hasImage: !!imageRef.current,
      hasCanvas: !!canvasRef.current
    });
    
    if (!enabled || !imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;

    // Wait for canvas to be in DOM
    const checkAndPrepare = () => {
      if (canvas.parentElement || document.body.contains(canvas)) {
        const handleLoad = () => {
          prepareCanvas(img);
        };

        if (img.complete && img.naturalWidth > 0) {
          // Image already loaded
          prepareCanvas(img);
        } else {
          img.addEventListener('load', handleLoad, { once: true });
        }
      } else {
        // Canvas not in DOM yet, retry
        setTimeout(checkAndPrepare, 50);
      }
    };

    checkAndPrepare();

    return () => {
      // Cleanup handled by other effects
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      const canvas = canvasRef.current;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return {
    canvasRef,
    isAnimating,
    isFinished,
  };
}

