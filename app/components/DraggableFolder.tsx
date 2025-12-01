"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

type DraggableFolderProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DraggableFolder({ children, className = '' }: DraggableFolderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [position, setPosition] = useState<{ top?: number; left?: number; width?: number; height?: number; position?: 'absolute' | 'relative' }>({ position: 'relative' });
  const [zIndex, setZIndex] = useState<number | undefined>(undefined);

  // Handle link clicks - prevent navigation if dragging occurred
  const handleCaptureClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only left click
    if (e.button !== 0) return;
    
    const folder = ref.current;
    if (!folder) return;

    // Find container (folder-grid)
    const container = folder.closest('.folder-grid') as HTMLElement;
    if (!container) return;

    e.preventDefault();
    isDraggingRef.current = false;
    
    const startX = e.clientX;
    const startY = e.clientY;

    // Ensure container is relative
    if (window.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    const containerRect = container.getBoundingClientRect();
    const folderRect = folder.getBoundingClientRect();

    const offsetX = startX - folderRect.left;
    const offsetY = startY - folderRect.top;

    // Switch to absolute positioning
    setPosition({
      position: 'absolute',
      left: folderRect.left - containerRect.left,
      top: folderRect.top - containerRect.top,
      width: folderRect.width,
      height: folderRect.height
    });
    setZIndex(9999);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDraggingRef.current = true;
      }

      const newLeft = moveEvent.clientX - containerRect.left - offsetX;
      const newTop = moveEvent.clientY - containerRect.top - offsetY;

      setPosition(prev => ({
        ...prev,
        left: newLeft,
        top: newTop
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setZIndex(undefined);
      
      // Reset drag flag after a short delay to allow click capture to fire
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  }, []);

  return (
    <div 
      ref={ref}
      className={className}
      onMouseDown={handleMouseDown}
      onClickCapture={handleCaptureClick}
      style={{
        position: position.position,
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        zIndex: zIndex,
        cursor: 'grab'
      }}
    >
      {children}
    </div>
  );
}

