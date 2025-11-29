"use client";

import { useEffect, useRef, useState } from 'react';

type RetroWindowProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;            // extra classes for the outer window
  variant?: "default" | "doublewide" | "widescreen" | "nomax" | "noratio";
  disableDrag?: boolean;
  disableResize?: boolean;
};

export default function RetroWindow({
  title,
  children,
  className,
  variant = "default",
  disableDrag,
  disableResize,
}: RetroWindowProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [z, setZ] = useState<number>(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mark as React-managed so global scripts skip it
    el.dataset.reactManaged = 'true';

    const isMobile = () => window.matchMedia('(pointer:coarse), (max-width: 767px)').matches;

    const header = el.querySelector<HTMLElement>('.window-bar');
    const closeBtn = el.querySelector<HTMLElement>('.x-out');
    const resizer = el.querySelector<HTMLElement>('.resize-corner');

    const getZIndex = (node: Element) => {
      const v = parseInt(window.getComputedStyle(node).zIndex, 10);
      return Number.isNaN(v) ? 0 : v;
    };
    const bringToFront = () => {
      const all = Array.from(document.querySelectorAll('.retro-window')) as HTMLElement[];
      const maxZ = all.reduce((m, n) => Math.max(m, getZIndex(n)), 0);
      el.style.zIndex = String(maxZ + 1);
      setZ(maxZ + 1);
    };

    // Clicking the window (not a link) brings it to front
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('a, .link-block')) bringToFront();
    };
    el.addEventListener('mousedown', onMouseDown, true);

    // Drag
    let dragging = false; let ox = 0; let oy = 0;
    const onHeaderDown = (e: MouseEvent) => {
      if (disableDrag || isMobile()) return;
      e.preventDefault();
      // During active dragging, remove breathing shadow and drop expensive static shadow
      el.classList.remove('breathing-shadow');
      el.classList.add('no-static-shadow');
      dragging = true; bringToFront();
      // Lock size before taking out of normal flow to prevent resize while dragging
      const rect = el.getBoundingClientRect();
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      const left = parseInt(el.style.left || String(el.offsetLeft), 10) || el.offsetLeft;
      const top  = parseInt(el.style.top  || String(el.offsetTop),  10) || el.offsetTop;
      ox = e.pageX - left; oy = e.pageY - top; el.style.cursor = 'grabbing';
      el.style.position = 'absolute';
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      el.style.left = `${e.pageX - ox}px`;
      el.style.top  = `${e.pageY - oy}px`;
    };
    const onUp = () => { 
      if (dragging) { 
        dragging = false; 
        el.style.cursor = 'default'; 
        el.classList.remove('no-static-shadow');
        // Restore breathing shadow by calling updateBreathingShadow if available
        if (typeof updateBreathingShadow === 'function') {
          try {
            updateBreathingShadow();
          } catch (e) {
            // Silently fail if updateBreathingShadow has issues
          }
        }
      } 
    };
    header?.addEventListener('mousedown', onHeaderDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Close
    const onClose = () => { (el as HTMLElement).style.display = 'none'; };
    closeBtn?.addEventListener('click', onClose);

    // Resize
    let resizing = false; let sx = 0; let sy = 0; let sw = 0; let sh = 0;
    const onResizeDown = (e: MouseEvent) => {
      if (disableResize || isMobile()) return;
      e.preventDefault(); bringToFront();
      resizing = true; sx = e.pageX; sy = e.pageY;
      const cs = window.getComputedStyle(el);
      sw = parseInt(cs.width, 10); sh = parseInt(cs.height, 10);
      document.addEventListener('mousemove', onResizing);
      document.addEventListener('mouseup', onResizeUp);
    };
    const onResizing = (e: MouseEvent) => {
      if (!resizing) return;
      const w = Math.max(200, sw + (e.pageX - sx));
      const h = Math.max(100, sh + (e.pageY - sy));
      el.style.width = `${w}px`; el.style.height = `${h}px`;
    };
    const onResizeUp = () => {
      resizing = false;
      document.removeEventListener('mousemove', onResizing);
      document.removeEventListener('mouseup', onResizeUp);
    };
    resizer?.addEventListener('mousedown', onResizeDown);

    return () => {
      el.removeEventListener('mousedown', onMouseDown, true);
      header?.removeEventListener('mousedown', onHeaderDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      closeBtn?.removeEventListener('click', onClose);
      resizer?.removeEventListener('mousedown', onResizeDown);
      document.removeEventListener('mousemove', onResizing);
      document.removeEventListener('mouseup', onResizeUp);
    };
  }, [disableDrag, disableResize]);

  const windowClass = [
    'retro-window',
    variant === 'doublewide' ? 'doublewide' : '',
    variant === 'widescreen' ? 'widescreen' : '',
    variant === 'nomax' ? 'nomax' : '',
    variant === 'noratio' ? 'noratio' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={windowClass}>
      <div className="window-bar">
        <div className="paragraph wide">{title}</div>
        <div className="x-out">×</div>
      </div>
      <div className="window-content-wrapper">
        <div className="window-content">
          {children}
        </div>
      </div>
      <div className="resize-corner" />
    </div>
  );
}


