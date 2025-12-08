'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
  isPrepared: boolean;
  effectSkipped: boolean;
}

const DEFAULT_STEPS = 8;
const DEFAULT_TOTAL_DURATION = 3000;
const DEFAULT_MIN_STEP_DELAY = 200;

/**
 * Hook that applies a pixelation animation effect to an image element.
 * Animation only starts when the parent .retro-window enters the viewport.
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [effectSkipped, setEffectSkipped] = useState(false);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isPreparedRef = useRef(false);
  const hasStartedRef = useRef(false);

  const maxStepDelay = Math.max(0, (totalDuration - steps * minStepDelay) / steps);

  // Update canvas size to match image
  const updateCanvasSize = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const width = Math.max(1, img.offsetWidth || img.naturalWidth || 100);
    const height = Math.max(1, img.offsetHeight || img.naturalHeight || 100);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  // Draw a single pixelation step
  const drawPixelStep = useCallback((
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    exponent: number
  ) => {
    updateCanvasSize(img, canvas);

    const width = canvas.width;
    const height = canvas.height;
    const pixelSize = Math.max(1, Math.pow(2, exponent));

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
    } catch {
      // ignore draw errors
    }
  }, [updateCanvasSize]);

  // Start the pixelation animation
  const startAnimation = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    if (hasStartedRef.current || isFinished) return;
    hasStartedRef.current = true;

    setIsAnimating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsAnimating(false);
      return;
    }

    let currentStep = 0;

    const doStep = () => {
      if (currentStep > steps) {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }

        // Hide canvas when animation is complete
        canvas.style.opacity = '0';
        setTimeout(() => {
          if (canvas.parentNode) {
            canvas.style.display = 'none';
          }
        }, 100);
        
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
  }, [steps, minStepDelay, maxStepDelay, drawPixelStep, isFinished]);

  // Main effect: setup canvas and viewport observer
  useEffect(() => {
    if (!enabled) return;

    const setupEffect = () => {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      
      if (!img || !canvas) return false;

      // Skip if already processed or has no-pixelate class
      if (img.classList?.contains('no-pixelate') || img.closest('.no-pixelate')) {
        setEffectSkipped(true);
        return true;
      }

      // Wait for image to be ready
      if (!img.complete || img.naturalWidth === 0) {
        return false;
      }

      // Draw initial pixelated state
      if (!isPreparedRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawPixelStep(img, canvas, ctx, steps);
          isPreparedRef.current = true;
          setIsPrepared(true);
        }
      }

      // Setup ResizeObserver
      if (!resizeObserverRef.current && typeof ResizeObserver !== 'undefined') {
        const parent = img.parentElement;
        if (parent) {
          resizeObserverRef.current = new ResizeObserver(() => {
            if (canvas && img && !isFinished && !hasStartedRef.current) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                drawPixelStep(img, canvas, ctx, steps);
              }
            }
          });
          resizeObserverRef.current.observe(parent);
        }
      }

      // Setup IntersectionObserver for viewport detection
      if (!intersectionObserverRef.current && typeof IntersectionObserver !== 'undefined') {
        // Find the retro window container
        const retroWindow = img.closest('.retro-window') || img.closest('[data-pixel-effect-enabled]');
        const observeTarget = retroWindow || img.parentElement || img;

        intersectionObserverRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && isPreparedRef.current && !hasStartedRef.current) {
                // Small delay to ensure everything is rendered
                setTimeout(() => {
                  const currentImg = imageRef.current;
                  const currentCanvas = canvasRef.current;
                  if (currentImg && currentCanvas && !hasStartedRef.current) {
                    startAnimation(currentImg, currentCanvas);
                  }
                }, 50);
              }
            });
          },
          {
            threshold: 0.1,
            rootMargin: '50px',
          }
        );

        intersectionObserverRef.current.observe(observeTarget);
      }

      return true;
    };

    // Try immediately
    if (setupEffect()) return;

    // If image isn't ready, wait for load event
    const img = imageRef.current;
    if (img) {
      const handleLoad = () => setupEffect();
      img.addEventListener('load', handleLoad);
      
      // Also retry periodically for dynamic content
      const intervalId = setInterval(() => {
        if (setupEffect()) {
          clearInterval(intervalId);
        }
      }, 100);

      // Cleanup after max retries
      const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);

      return () => {
        img.removeEventListener('load', handleLoad);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [enabled, steps, drawPixelStep, startAnimation, isFinished]);

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
    };
  }, []);

  return {
    canvasRef,
    isAnimating,
    isFinished,
    isPrepared,
    effectSkipped,
  };
}
