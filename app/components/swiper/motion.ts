'use client';

import { useEffect, useState, type RefObject } from 'react';

// Minimal stand-ins for the two framer-motion hooks the Swiper landing
// components use, so the port carries no extra dependency.

// True while at least `amount` (0..1) of the element is inside the viewport.
export function useInView(ref: RefObject<Element | null>, { amount = 0 }: { amount?: number } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= amount),
      { threshold: amount },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, amount]);
  return inView;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
