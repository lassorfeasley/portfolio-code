'use client';

import { useEffect, useState } from "react";
import { SWIPE_STEPS, sleep, stepMs, swipeStart, type Exercise, type Phase } from "./phone";

// A short tour of a workout: swipe the open sets of exercise `a`, scrub the
// exercise list down to `b`, swipe two of its sets, then scrub back to `a`,
// which is reset while hidden so the loop starts over cleanly.
export type TourState = {
  a: Phase[];
  b: Phase[];
  // Exercise whose card is showing when not scrubbing.
  index: number;
  // Fractional list position while scrubbing.
  progress: number;
  scrubbing: boolean;
  from: number;
  to: number;
  // Whether the finger (or crown) driving the scrub is down.
  touch: "none" | "down" | "lifting";
};

export const doneSets = (phases: Phase[]) => phases.filter((p) => p === "complete").length;

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export function useExerciseTour(
  running: boolean,
  { a, b, aAt, bAt, startDelay = 1500, scrubMs = 1700 }: { a: Exercise; b: Exercise; aAt: number; bAt: number; startDelay?: number; scrubMs?: number },
) {
  const start: TourState = {
    a: swipeStart(a),
    b: swipeStart(b),
    index: aAt,
    progress: aAt,
    scrubbing: false,
    from: aAt,
    to: aAt,
    touch: "none",
  };
  const [state, setState] = useState<TourState>(start);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const update = (patch: Partial<TourState> | ((s: TourState) => Partial<TourState>)) =>
      !cancelled && setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
    const swipe = async (key: "a" | "b", i: number) => {
      for (const step of SWIPE_STEPS) {
        update((s) => ({ [key]: s[key].map((p, j) => (j === i ? step : p)) }));
        await sleep(stepMs(step));
        if (cancelled) return;
      }
    };
    const tween = (ms: number, frame: (t: number) => void) =>
      new Promise<void>((resolve) => {
        const t0 = performance.now();
        const tick = (now: number) => {
          if (cancelled) return resolve();
          const p = Math.min(1, (now - t0) / ms);
          frame(easeInOut(p));
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    const scrub = async (from: number, to: number, onHidden?: () => void) => {
      update({ from, to, progress: from, touch: "down" });
      await sleep(250);
      update({ scrubbing: true });
      onHidden?.();
      await sleep(250);
      await tween(scrubMs, (t) => update({ progress: from + (to - from) * t }));
      await sleep(200);
      update({ touch: "lifting" });
      await sleep(450);
      update({ scrubbing: false, index: to });
      await sleep(250);
      update({ touch: "none" });
    };
    const initial = swipeStart(a);
    const aOpen = initial.flatMap((p, i) => (p === "idle" ? [i] : []));
    const bOpen = swipeStart(b).flatMap((p, i) => (p === "idle" ? [i] : [])).slice(0, 2);
    (async () => {
      while (!cancelled) {
        await sleep(startDelay);
        for (const i of aOpen) {
          await swipe("a", i);
          await sleep(700);
        }
        await sleep(200);
        if (cancelled) return;
        await scrub(aAt, bAt);
        await sleep(700);
        for (const i of bOpen) {
          await swipe("b", i);
          await sleep(700);
        }
        await sleep(900);
        if (cancelled) return;
        await scrub(bAt, aAt, () => update({ a: initial }));
        update({ b: swipeStart(b) });
      }
    })();
    return () => {
      cancelled = true;
      setState(start);
    };
    // The tour restarts only when `running` flips; the exercise props are static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return state;
}
