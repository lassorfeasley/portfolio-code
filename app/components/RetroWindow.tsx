"use client";

import { useRetroWindowInteraction } from '@/app/hooks/useRetroWindowInteraction';
import { useMemo } from 'react';
import PixelEffectContext from '@/app/contexts/PixelEffectContext';

type RetroWindowProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;            // extra classes for the outer window
  variant?: "default" | "doublewide" | "widescreen" | "nomax" | "noratio";
  disableDrag?: boolean;
  disableResize?: boolean;
  initialZIndex?: number;
  autoFocus?: boolean;
};

export default function RetroWindow({
  title,
  children,
  className,
  variant = "default",
  disableDrag,
  disableResize,
  initialZIndex,
  autoFocus,
}: RetroWindowProps) {
  const {
    ref,
    windowStyle,
    handleWindowMouseDown,
    handleDragStart,
    handleResizeStart,
    handleClose,
  } = useRetroWindowInteraction({
    disableDrag,
    disableResize,
    initialZIndex,
    autoFocus,
  });

  const windowClass = useMemo(
    () =>
      [
        'retro-window',
        variant === 'doublewide' ? 'doublewide' : '',
        variant === 'widescreen' ? 'widescreen' : '',
        variant === 'nomax' ? 'nomax' : '',
        variant === 'noratio' ? 'noratio' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    [className, variant]
  );

  return (
    <div
      ref={ref}
      className={windowClass}
      style={windowStyle}
      onMouseDown={handleWindowMouseDown}
    >
      <div className="window-bar" onMouseDown={handleDragStart}>
        <div className="paragraph wide">{title}</div>
        <div
          className="x-out"
          role="button"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleClose();
            }
          }}
          aria-label="Close window"
        >
          ×
        </div>
      </div>
      <div className="window-content-wrapper">
        <div className="window-content">
          <PixelEffectContext.Provider value={true}>
            {children}
          </PixelEffectContext.Provider>
        </div>
      </div>
      <div className="resize-corner" onMouseDown={handleResizeStart} />
    </div>
  );
}


