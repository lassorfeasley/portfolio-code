'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Options = {
  disableDrag?: boolean;
  disableResize?: boolean;
  initialZIndex?: number;
  autoFocus?: boolean;
};

type PointerState =
  | {
      mode: 'drag';
      pointerOffsetX: number;
      pointerOffsetY: number;
      canvasRect: DOMRect;
      lockedWidth: number;
      lockedHeight: number;
    }
  | {
      mode: 'resize';
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    }
  | null;

const SAFE_BOTTOM_PADDING = 80;
const ALLOW_OVERFLOW_X = 100;
const ALLOW_OVERFLOW_Y = 150;

const isMobile = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;

export function useRetroWindowInteraction(options: Options) {
  const { disableDrag, disableResize, initialZIndex, autoFocus } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef<PointerState>(null);
  const [zIndex, setZIndex] = useState<number | undefined>(initialZIndex);
  const [position, setPosition] = useState<{ left?: number; top?: number }>({});
  const [size, setSize] = useState<{ width?: number; height?: number }>({});

  const markReactManaged = useCallback(() => {
    if (ref.current) {
      ref.current.dataset.reactManaged = 'true';
    }
  }, []);

  const bringToFront = useCallback(() => {
    const current = ref.current;
    if (!current) return;

    const windows = Array.from(
      document.querySelectorAll<HTMLElement>('.retro-window')
    );
    const maxZ = windows.reduce((acc, el) => {
      const parsed = parseInt(window.getComputedStyle(el).zIndex, 10);
      return Number.isNaN(parsed) ? acc : Math.max(acc, parsed);
    }, 0);
    const nextZ = maxZ + 1;
    setZIndex(nextZ);
  }, []);

  useEffect(() => {
    markReactManaged();
    if (typeof initialZIndex === 'number') {
      setZIndex(initialZIndex);
    }
  }, [markReactManaged, initialZIndex]);

  useEffect(() => {
    if (autoFocus) {
      bringToFront();
    }
  }, [autoFocus, bringToFront]);

  const clampDragPosition = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const handlePointerMove = useCallback(
    (event: MouseEvent) => {
      const current = ref.current;
      const state = pointerState.current;
      if (!current || !state) return;

      if (state.mode === 'drag') {
        const canvasRect = state.canvasRect;
        const pointerX = event.pageX - canvasRect.left;
        const pointerY = event.pageY - canvasRect.top;
        const minLeft = -ALLOW_OVERFLOW_X;
        const maxLeft =
          canvasRect.width - state.lockedWidth + ALLOW_OVERFLOW_X;
        const minTop = -ALLOW_OVERFLOW_Y;
        const maxTop =
          canvasRect.height -
          state.lockedHeight +
          Math.max(0, ALLOW_OVERFLOW_Y - SAFE_BOTTOM_PADDING);
        const targetLeft = clampDragPosition(
          pointerX - state.pointerOffsetX,
          minLeft,
          maxLeft
        );
        const targetTop = clampDragPosition(
          pointerY - state.pointerOffsetY,
          minTop,
          maxTop
        );

        setPosition({ left: targetLeft, top: targetTop });
        // Force width/height during drag to prevent CSS overrides
        setSize({
          width: state.lockedWidth,
          height: state.lockedHeight,
        });
      } else if (state.mode === 'resize') {
        const nextWidth = Math.max(
          200,
          state.startWidth + (event.pageX - state.startX)
        );
        const nextHeight = Math.max(
          100,
          state.startHeight + (event.pageY - state.startY)
        );
        setSize({ width: nextWidth, height: nextHeight });
      }
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    const current = ref.current;
    const state = pointerState.current;
    if (!current || !state) {
      pointerState.current = null;
      return;
    }

    if (state.mode === 'drag') {
      current.style.cursor = 'default';
      current.classList.remove('no-static-shadow');
      current.classList.add('breathing-shadow');
      
      // KEEP width and height so they don't snap back
      // Also, we need to ensure the inline style is applied *immediately* via state
      // because React batching might cause a flash.
      // But we already set size in handlePointerMove, so it should be fine.
      // The issue might be if we were clearing it. Here we explicitly set it.
      // Maybe we need to read from current style if drag didn't move?
      // But drag only starts on mouse move... wait no, drag starts on mouse down.
      // If we mouse down but don't move, size state might be empty?
      
      // Actually, drag START sets size state.
      // So we just need to ensure we don't clear it here.
      // The previous code was: setSize((prev) => ({ ...prev, height: undefined }));
      // which CLEARED height. Now we are doing:
      setSize(() => ({
        width: state.lockedWidth,
        height: state.lockedHeight,
      }));

      if (typeof window.updateBreathingShadow === 'function') {
        try {
          window.updateBreathingShadow();
        } catch {
          // no-op
        }
      }
    }

    pointerState.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleWindowMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('a, .link-block')) return;
      bringToFront();
    },
    [bringToFront]
  );

  const handleDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disableDrag || isMobile()) return;
      const current = ref.current;
      if (!current) return;
      event.preventDefault();
      bringToFront();
      current.classList.remove('breathing-shadow');
      current.classList.add('no-static-shadow');
      current.style.cursor = 'grabbing';

      // Float legacy windows if helper exists
      if (typeof window.retroFloatWindow === 'function') {
        try {
          window.retroFloatWindow(current);
        } catch {
          // ignore failure
        }
      }

      const canvas =
        current.closest<HTMLElement>('.windowcanvas') ?? document.body;
      const canvasRect = canvas.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      
      // Use offsetLeft/Top if styles are missing (initial render)
      const currentLeft =
        Number.isFinite(parseFloat(current.style.left))
          ? parseFloat(current.style.left)
          : rect.left - canvasRect.left;
      const currentTop =
        Number.isFinite(parseFloat(current.style.top))
          ? parseFloat(current.style.top)
          : rect.top - canvasRect.top;
          
      const pointerX = event.pageX - canvasRect.left;
      const pointerY = event.pageY - canvasRect.top;

      pointerState.current = {
        mode: 'drag',
        pointerOffsetX: pointerX - currentLeft,
        pointerOffsetY: pointerY - currentTop,
        canvasRect,
        lockedWidth: rect.width,
        lockedHeight: rect.height,
      };

      // Lock size immediately on drag start
      setSize({
        width: rect.width,
        height: rect.height,
      });
      
      // Also sync position state immediately so we don't snap to 0,0
      setPosition({
        left: currentLeft,
        top: currentTop,
      });
    },
    [bringToFront, disableDrag]
  );

  const handleResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disableResize || isMobile()) return;
      const current = ref.current;
      if (!current || pointerState.current?.mode === 'drag') return;
      event.preventDefault();
      bringToFront();
      const computed = window.getComputedStyle(current);

      pointerState.current = {
        mode: 'resize',
        startX: event.pageX,
        startY: event.pageY,
        startWidth: parseFloat(computed.width) || current.offsetWidth,
        startHeight: parseFloat(computed.height) || current.offsetHeight,
      };

      // Float legacy windows if helper exists
      if (typeof window.retroFloatWindow === 'function') {
        try {
          window.retroFloatWindow(current);
        } catch {
          // ignore failure
        }
      }
    },
    [bringToFront, disableResize]
  );

  const windowStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    if (typeof position.left === 'number') {
      style.left = `${position.left}px`;
      style.position = 'absolute';
    }
    if (typeof position.top === 'number') {
      style.top = `${position.top}px`;
      style.position = 'absolute';
    }
    if (typeof size.width === 'number') {
      style.width = `${size.width}px`;
      style.maxWidth = `${size.width}px`;
    }
    if (typeof size.height === 'number') {
      style.height = `${size.height}px`;
      style.maxHeight = `${size.height}px`;
    }
    if (typeof zIndex === 'number') {
      style.zIndex = zIndex;
    }
    return style;
  }, [position.left, position.top, size.height, size.width, zIndex]);

  const handleClose = useCallback(() => {
    if (ref.current) {
      ref.current.style.display = 'none';
    }
  }, []);

  return {
    ref,
    windowStyle,
    handleWindowMouseDown,
    handleDragStart,
    handleResizeStart,
    handleClose,
  };
}

export type UseRetroWindowInteractionResult = ReturnType<
  typeof useRetroWindowInteraction
>;
