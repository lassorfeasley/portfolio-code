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
      // Offset from cursor to window's top-left corner (viewport coordinates)
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

export function useRetroWindowInteraction(options: Options) {
  const { disableDrag, disableResize, initialZIndex, autoFocus } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const pointerState = useRef<PointerState>(null);
  // Default to 1000 to ensure windows are above canvases on initial render
  const [zIndex, setZIndex] = useState<number>(initialZIndex ?? 1000);
  const [position, setPosition] = useState<{ left?: number; top?: number }>({});
  const [size, setSize] = useState<{ width?: number; height?: number }>({});
  // Track if window has been dragged
  const [isDragged, setIsDragged] = useState(false);
  // Track if actively dragging (for fixed vs absolute positioning)
  const [isDragging, setIsDragging] = useState(false);

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
    }, 1000);
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

  const handlePointerMove = useCallback(
    (event: MouseEvent) => {
      const current = ref.current;
      const state = pointerState.current;
      if (!current || !state) return;

      if (state.mode === 'drag') {
        // Calculate position in viewport coordinates (for fixed positioning)
        const targetLeft = event.clientX - state.cursorOffsetX;
        const targetTop = event.clientY - state.cursorOffsetY;

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
      
      // Convert from viewport (fixed) to parent-relative (absolute) coordinates
      // so the window scrolls with the page
      const rect = current.getBoundingClientRect();
      
      // Find the positioned parent that will be the containing block for absolute positioning
      // When fixed, offsetParent is null, so we find the parent manually
      let parent = current.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position !== 'static') {
          break;
        }
        parent = parent.parentElement;
      }
      const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
      
      // Calculate position relative to parent
      const relativeLeft = rect.left - parentRect.left;
      const relativeTop = rect.top - parentRect.top;
      
      // Apply position change directly to DOM first to avoid flicker
      // This ensures the visual transition is smooth before React re-renders
      current.style.position = 'absolute';
      current.style.left = `${relativeLeft}px`;
      current.style.top = `${relativeTop}px`;
      
      // Then update React state to match
      setIsDragging(false);
      setPosition({
        left: relativeLeft,
        top: relativeTop,
      });
      
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
      
      // Mark as dragged and actively dragging
      setIsDragged(true);
      setIsDragging(true);
          
      // Store cursor offset from window's top-left corner (in viewport coordinates for fixed positioning)
      const cursorOffsetX = event.clientX - rect.left;
      const cursorOffsetY = event.clientY - rect.top;

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
      
      // Set initial position in viewport coordinates (for fixed positioning)
      setPosition({
        left: rect.left,
        top: rect.top,
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
      
      const rect = current.getBoundingClientRect();
      
      // Mark as dragged for positioning
      if (!isDragged) {
        setIsDragged(true);
        // Find positioned parent for absolute positioning reference
        let parent = current.parentElement;
        while (parent && parent !== document.body) {
          const parentStyle = window.getComputedStyle(parent);
          if (parentStyle.position !== 'static') {
            break;
          }
          parent = parent.parentElement;
        }
        const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
        setPosition({
          left: rect.left - parentRect.left,
          top: rect.top - parentRect.top,
        });
      }
      
      const computed = window.getComputedStyle(current);

      pointerState.current = {
        mode: 'resize',
        startX: event.pageX,
        startY: event.pageY,
        startWidth: parseFloat(computed.width) || current.offsetWidth,
        startHeight: parseFloat(computed.height) || current.offsetHeight,
      };
    },
    [bringToFront, disableResize, isDragged]
  );

  const windowStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    
    // Only apply position styles if the window has been dragged
    if (isDragged && typeof position.left === 'number' && typeof position.top === 'number') {
      if (isDragging) {
        // During drag: use fixed positioning (viewport-relative) for freedom of movement
        style.position = 'fixed';
      } else {
        // After drag: use absolute positioning (document-relative) so window scrolls with page
        style.position = 'absolute';
      }
      style.left = `${position.left}px`;
      style.top = `${position.top}px`;
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
  }, [position.left, position.top, size.height, size.width, zIndex, isDragged, isDragging]);

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
