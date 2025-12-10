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
      // Cursor offset from the window's top-left corner
      cursorOffsetX: number;
      cursorOffsetY: number;
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

const isMobile = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;

// Get or create a float layer for windows that have been dragged
function getFloatLayer(): HTMLElement {
  let layer = document.getElementById('window-float-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'window-float-layer';
    layer.className = 'window-float-layer';
    document.body.appendChild(layer);
  }
  return layer;
}

export function useRetroWindowInteraction(options: Options) {
  const { disableDrag, disableResize, initialZIndex, autoFocus } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef<PointerState>(null);
  // Default to 1000 to ensure windows are above canvases on initial render
  const [zIndex, setZIndex] = useState<number>(initialZIndex ?? 1000);
  const [position, setPosition] = useState<{ left?: number; top?: number }>({});
  const [size, setSize] = useState<{ width?: number; height?: number }>({});
  const [isFloated, setIsFloated] = useState(false);

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
    }, 1000); // Start from 1000 to ensure above canvases
    const nextZ = maxZ + 1;
    setZIndex(nextZ);
  }, []);

  useEffect(() => {
    markReactManaged();
  }, [markReactManaged]);

  useEffect(() => {
    if (autoFocus) {
      bringToFront();
    }
  }, [autoFocus, bringToFront]);

  // Move window to float layer so it escapes stacking contexts
  const floatWindow = useCallback(() => {
    const current = ref.current;
    if (!current || isFloated) return;

    const rect = current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Calculate position relative to document (for absolute positioning in body)
    const docLeft = rect.left + scrollX;
    const docTop = rect.top + scrollY;

    // Move to float layer
    const floatLayer = getFloatLayer();
    floatLayer.appendChild(current);

    // Set position relative to document
    setPosition({ left: docLeft, top: docTop });
    setSize({ width: rect.width, height: rect.height });
    setIsFloated(true);
  }, [isFloated]);

  const handlePointerMove = useCallback(
    (event: MouseEvent) => {
      const current = ref.current;
      const state = pointerState.current;
      if (!current || !state) return;

      if (state.mode === 'drag') {
        // Calculate position relative to document (pageX/pageY include scroll)
        const targetLeft = event.pageX - state.cursorOffsetX;
        const targetTop = event.pageY - state.cursorOffsetY;

        setPosition({ left: targetLeft, top: targetTop });
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

      const rect = current.getBoundingClientRect();
      
      // Float the window to escape stacking contexts
      floatWindow();
          
      // Store cursor offset from window's top-left corner
      // Use pageX/pageY for document-relative positioning
      const cursorOffsetX = event.pageX - (rect.left + window.scrollX);
      const cursorOffsetY = event.pageY - (rect.top + window.scrollY);

      pointerState.current = {
        mode: 'drag',
        cursorOffsetX,
        cursorOffsetY,
        lockedWidth: rect.width,
        lockedHeight: rect.height,
      };

      // Lock size immediately on drag start
      setSize({
        width: rect.width,
        height: rect.height,
      });
      
      // Set initial position relative to document
      setPosition({
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
      });
    },
    [bringToFront, disableDrag, floatWindow]
  );

  const handleResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disableResize || isMobile()) return;
      const current = ref.current;
      if (!current || pointerState.current?.mode === 'drag') return;
      event.preventDefault();
      bringToFront();
      
      // Float the window to escape stacking contexts
      floatWindow();
      
      const computed = window.getComputedStyle(current);

      pointerState.current = {
        mode: 'resize',
        startX: event.pageX,
        startY: event.pageY,
        startWidth: parseFloat(computed.width) || current.offsetWidth,
        startHeight: parseFloat(computed.height) || current.offsetHeight,
      };
    },
    [bringToFront, disableResize, floatWindow]
  );

  const windowStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    
    // Only apply position styles if the window has been floated
    if (isFloated) {
      if (typeof position.left === 'number') {
        style.left = `${position.left}px`;
        style.position = 'absolute';
      }
      if (typeof position.top === 'number') {
        style.top = `${position.top}px`;
        style.position = 'absolute';
      }
    }
    
    if (typeof size.width === 'number') {
      style.width = `${size.width}px`;
      style.maxWidth = `${size.width}px`;
    }
    if (typeof size.height === 'number') {
      style.height = `${size.height}px`;
      style.maxHeight = `${size.height}px`;
    }
    // Always set zIndex to ensure windows are above canvases
    style.zIndex = zIndex;
    return style;
  }, [position.left, position.top, size.height, size.width, zIndex, isFloated]);

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
