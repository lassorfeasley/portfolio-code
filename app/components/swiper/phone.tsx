'use client';

import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DeviceBody, DeviceStage, OUTLINE, rail, type Button } from "./device";
import {
  ChevronDown,
  ChevronUp,
  Grip,
  Pause,
  Plus,
  Repeat2,
  Signal,
  SlidersHorizontal,
  Weight,
  Wifi,
} from "lucide-react";

// The iOS active-exercise screen (marketing/app-store/screens/active.png),
// rebuilt in points so it can animate, inside a CSS 3D iPhone 16 Pro Max.
// Device geometry is from Apple's dimensional drawing: 77.58 x 163.03 x 8.25 mm,
// 2.36 mm from the housing edge to the active display, buttons proud by 0.45 mm.
export const SCREEN = { w: 440, h: 956, r: 63 };
const PT_PER_MM = SCREEN.w / 72.86;
const mm = (v: number) => v * PT_PER_MM;
const BORDER = mm(2.36);
export const BODY = { w: SCREEN.w + 2 * BORDER, h: SCREEN.h + 2 * BORDER, r: SCREEN.r + BORDER, t: mm(8.25) };
export const GREEN = "#22c55e";

export type SetSpec = { done: boolean; reps: number; weight: number };
export type Exercise = { name: string; workout: string; focus: string; sets: SetSpec[] };

export const BENCH: Exercise = {
  name: "Bench press",
  workout: "Monday Night Workout",
  focus: "Chest and tricep",
  sets: [
    { done: true, reps: 10, weight: 135 },
    { done: false, reps: 8, weight: 155 },
    { done: false, reps: 6, weight: 175 },
  ],
};
export const FLY: Exercise = {
  name: "Cable fly",
  workout: "Monday Night Workout",
  focus: "Chest and tricep",
  sets: [
    { done: false, reps: 12, weight: 40 },
    { done: false, reps: 12, weight: 45 },
    { done: false, reps: 10, weight: 50 },
  ],
};
export const CURL: Exercise = {
  name: "Bicep curl",
  workout: "Arm day",
  focus: "Biceps and triceps",
  sets: [
    { done: true, reps: 12, weight: 25 },
    { done: false, reps: 10, weight: 30 },
    { done: false, reps: 8, weight: 35 },
  ],
};
export const PULLDOWN: Exercise = {
  name: "Lat pulldown",
  workout: "Pull day",
  focus: "Back and bicep",
  sets: [
    { done: true, reps: 12, weight: 100 },
    { done: false, reps: 10, weight: 115 },
    { done: false, reps: 8, weight: 130 },
  ],
};
export const HAMMER: Exercise = {
  name: "Hammer curl",
  workout: "Pull day",
  focus: "Back and bicep",
  sets: [
    { done: false, reps: 12, weight: 25 },
    { done: false, reps: 10, weight: 30 },
    { done: false, reps: 8, weight: 35 },
  ],
};
export const setTop = (i: number) => 207 + i * 97;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Row({ top, height, children }: { top: number; height: number; children: ReactNode }) {
  return (
    <div className="absolute left-0 right-0" style={{ top, height }}>
      {children}
    </div>
  );
}

// Positions along each side in mm from the top of the housing.
const BUTTONS: Button[] = [
  { side: "left", from: 30.5, to: 37.5 },
  { side: "left", from: 44.5, to: 54.5 },
  { side: "left", from: 57.5, to: 67.5 },
  { side: "right", from: 44, to: 61 },
  { side: "right", from: 101, to: 113 },
].map((b) => ({ ...b, side: b.side as Button["side"], from: mm(b.from), to: mm(b.to), proud: mm(0.45) }));

// A tilted iPhone with its screen content as children. The lower part of the
// screen is usually empty, so the frame shows the top `crop` of the phone and
// lets the rest overflow (the parent clips it).
export const PhoneFrame = forwardRef<
  HTMLDivElement,
  { scale: number; crop: number; mirror?: boolean; className?: string; children: ReactNode }
>(function PhoneFrame({ scale, crop, mirror = false, className = "", children }, ref) {
  return (
    <DeviceStage ref={ref} body={BODY} width={BODY.w} height={BODY.h * crop} scale={scale} mirror={mirror} className={className}>
      <DeviceBody body={BODY} buttons={BUTTONS} />
      {/* Front: cover glass over a black border, with the rail's rounded front edge as a thin lip. */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          borderRadius: BODY.r,
          transform: `translateZ(${BODY.t / 2 + 0.5}px)`,
          boxShadow: `inset 0 0 0 1px ${OUTLINE}, inset 0 0 0 2.5px ${rail(1)}, inset 0 0 0 3.5px #0d0d0d`,
        }}
      >
        <div
          className="absolute bg-black text-white overflow-hidden"
          style={{ left: BORDER, top: BORDER, width: SCREEN.w, height: SCREEN.h, borderRadius: SCREEN.r }}
        >
          {children}
          <div className="absolute z-50 left-1/2 top-[11px] -translate-x-1/2 w-[126px] h-[37px] rounded-full bg-black" />
          <GlassSheen />
        </div>
      </div>
    </DeviceStage>
  );
});

export function GlassSheen() {
  return <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(115deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_38%)]" />;
}

export function StatusBar() {
  return (
    <div className="absolute top-[19px] left-0 right-0 z-30 flex items-center justify-between px-[68px] text-[17px] font-semibold">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal size={17} strokeWidth={2.5} />
        <Wifi size={17} strokeWidth={2.5} />
        <span className="flex items-center gap-[1.5px]">
          <span className="w-[25px] h-[12px] rounded-[4px] border border-white/40 p-[1.5px]">
            <span className="block h-full w-[80%] rounded-[2px] bg-white" />
          </span>
          <span className="w-[1.5px] h-[4px] rounded-r-full bg-white/40" />
        </span>
      </span>
    </div>
  );
}

// Elapsed workout time in m:ss, counting up once a second from `start` seconds.
function WorkoutTimer({ start }: { start: number }) {
  const [seconds, setSeconds] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </>
  );
}

// The right-hand column with chevrons, one dot per exercise and the section name.
export function Gutter({ active = 2, count = 6 }: { active?: number; count?: number }) {
  return (
    <div className="absolute right-[10px] top-[396px] flex flex-col items-center gap-3 text-neutral-400">
      <ChevronUp size={18} />
      <div className="flex flex-col items-center gap-[7px]">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`size-[5px] rounded-full transition-colors duration-200 ${i === active ? "bg-white" : "bg-neutral-500"}`}
          />
        ))}
      </div>
      <ChevronDown size={18} />
      <span className="mt-8 text-[10px] tracking-[0.2em] font-medium [writing-mode:vertical-rl] rotate-180">
        TRAINING
      </span>
    </div>
  );
}

// Workout header, exercise title, section rail and set labels. `renderSet`
// draws the switch for each set.
export function WorkoutScreen({
  exercise,
  doneCount,
  renderSet,
}: {
  exercise: Exercise;
  doneCount: number;
  renderSet: (i: number) => ReactNode;
}) {
  return (
    <>
      <Gutter />
      <WorkoutHeader exercise={exercise} doneCount={doneCount} />
      <ExerciseCard exercise={exercise} renderSet={renderSet} />
    </>
  );
}

export function WorkoutHeader({ exercise, doneCount }: { exercise: Exercise; doneCount: number }) {
  return (
    <Row top={56} height={72}>
      <div className="flex items-center gap-3 px-4 pt-3">
        <span className="h-10 px-3 rounded-full bg-white text-black font-mono text-[17px] font-medium flex items-center">
          <WorkoutTimer start={23 * 60 + 20} />
        </span>
        <span className="flex-1 leading-tight">
          <span className="block text-[15px] font-semibold">{exercise.workout}</span>
          <span className="block text-[13px] text-neutral-400">{exercise.focus}</span>
        </span>
        <span className="size-10 rounded-full bg-orange-500 flex items-center justify-center">
          <Pause size={18} fill="currentColor" strokeWidth={0} />
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-neutral-800">
        <div className="h-full bg-[#22c55e] transition-[width] duration-500" style={{ width: `${21 + doneCount * 5}%` }} />
      </div>
    </Row>
  );
}

export function ExerciseCard({ exercise, renderSet }: { exercise: Exercise; renderSet: (i: number) => ReactNode }) {
  const { sets } = exercise;
  return (
    <>
      <Row top={140} height={40}>
        <div className="flex items-center justify-between pl-5 pr-[51px]">
          <span className="text-[30px] font-bold tracking-tight">{exercise.name}</span>
          <SlidersHorizontal size={22} className="text-neutral-400" />
        </div>
      </Row>

      {sets.map((_, i) => (
        <Row key={i} top={setTop(i) - 17} height={12}>
          <div className="px-5 text-[11px] font-semibold tracking-wider text-neutral-400">SET {i + 1}</div>
        </Row>
      ))}
      {sets.map((_, i) => (
        <Row key={i} top={setTop(i)} height={TRACK.h}>
          {renderSet(i)}
        </Row>
      ))}

      <Row top={setTop(sets.length - 1) + 90} height={28}>
        <Plus size={24} strokeWidth={1.5} className="ml-5 text-neutral-500" />
      </Row>
    </>
  );
}

// Phases and timings follow SwipeSwitch.runCompletionAnimation in the iOS app:
// drag to the end, snap green, fill the inner rail, fill the track, draw the check.
export type Phase = "idle" | "drag" | "snapped" | "inner" | "full" | "complete";
export const PHASE_MS: Record<Phase, number> = { idle: 0, drag: 650, snapped: 100, inner: 350, full: 500, complete: 350 };
export type Track = { w: number; h: number; pad: number; r: number; thumbW: number; thumbR: number };
export const TRACK: Track = { w: SCREEN.w - 20 - 49, h: 64, pad: 6, r: 12, thumbW: 80, thumbR: 8 };

function thumbStyle(phase: Phase, k: Track): CSSProperties {
  const { pad } = k;
  const thumbH = k.h - 2 * pad;
  const travel = k.w - k.thumbW - 2 * pad;
  const box = {
    idle: [pad, pad, k.thumbW, thumbH, k.thumbR],
    drag: [pad + travel, pad, k.thumbW, thumbH, k.thumbR],
    snapped: [pad + travel, pad, k.thumbW, thumbH, k.thumbR],
    inner: [pad, pad, k.w - 2 * pad, thumbH, k.thumbR],
    full: [0, 0, k.w, k.h, k.r],
    complete: [0, 0, k.w, k.h, k.r],
  }[phase];
  const [left, top, width, height, borderRadius] = box;
  return {
    left,
    top,
    width,
    height,
    borderRadius,
    background: phase === "idle" || phase === "drag" ? "#fff" : GREEN,
    transitionProperty: "left, top, width, height, border-radius, background-color",
    transitionDuration: `${PHASE_MS[phase]}ms`,
    transitionTimingFunction: phase === "drag" ? "cubic-bezier(.45,0,.25,1)" : "ease-in-out",
  };
}

// While the thumb is dragged across, each label blurs and dissolves as the
// thumb reaches it; `at` is the label's delay into the drag in ms.
function dissolve(phase: Phase, at: number): CSSProperties {
  const shown = phase === "idle";
  return {
    opacity: shown ? 1 : 0,
    filter: shown ? "blur(0px)" : "blur(8px)",
    transition:
      phase === "drag" ? `opacity 280ms ease-in ${at}ms, filter 280ms ease-in ${at}ms` : "opacity 150ms, filter 150ms",
  };
}

// The watch draws reps and weight as one group with a short divider; the
// phone splits them into columns with a full-height divider.
export function SetCard({
  phase,
  hidden = false,
  highlight = false,
  reps,
  weight,
  track = TRACK,
  watch = false,
}: {
  phase: Phase;
  hidden?: boolean;
  highlight?: boolean;
  reps?: number;
  weight?: number;
  track?: Track;
  watch?: boolean;
}) {
  const showGrip = phase === "idle" || phase === "drag";
  return (
    <div
      className={`relative bg-[#2c2c2e] transition-[opacity,box-shadow] duration-300 ${watch ? "" : "ml-5"}`}
      style={{
        width: track.w,
        height: track.h,
        borderRadius: track.r,
        opacity: hidden ? 0 : 1,
        boxShadow: highlight ? `0 0 0 2px ${GREEN}` : "0 0 0 0px transparent",
      }}
    >
      {reps !== undefined && watch && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end gap-3 pr-5 text-[30px] text-neutral-400 tabular-nums"
          style={{ left: track.thumbW + track.pad }}
        >
          <span className="flex items-center gap-2" style={dissolve(phase, 200)}>
            <Repeat2 size={26} strokeWidth={2} />
            {reps}
          </span>
          <span className="h-8 w-[1.5px] bg-neutral-600" style={dissolve(phase, 290)} />
          <span className="flex items-center gap-2" style={dissolve(phase, 340)}>
            <Weight size={24} strokeWidth={2} />
            {weight}
          </span>
        </div>
      )}
      {reps !== undefined && !watch && (
        <div
          className="absolute inset-y-0 right-0 flex items-center"
          style={{ left: track.thumbW + track.pad }}
        >
          <div
            className="flex-1 flex items-center justify-end gap-1.5 pr-3 text-[30px] font-light text-neutral-400 tabular-nums"
            style={dissolve(phase, 200)}
          >
            <Repeat2 size={24} strokeWidth={1.75} />
            {reps}
          </div>
          <div className="h-full w-px bg-black/40" style={dissolve(phase, 290)} />
          <div
            className="w-[92px] flex items-center justify-end gap-1.5 pr-2 text-[30px] font-light text-neutral-400 tabular-nums"
            style={dissolve(phase, 340)}
          >
            <Weight size={22} strokeWidth={1.75} />
            {weight}
          </div>
        </div>
      )}
      <div className="absolute flex items-center justify-center" style={thumbStyle(phase, track)}>
        <Grip
          className="absolute text-neutral-500 transition-opacity duration-100"
          size={watch ? 20 : 16}
          style={{ opacity: showGrip ? 1 : 0 }}
        />
        <svg viewBox="0 0 28 28" className={`absolute ${watch ? "size-9" : "size-7"}`} fill="none">
          <path
            d="M4.2 15.4 11.2 22.4 23.8 7"
            stroke="#fff"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={phase === "complete" ? 0 : 1}
            style={{ transition: phase === "complete" ? "stroke-dashoffset 350ms ease-out 100ms" : "none" }}
          />
        </svg>
      </div>
    </div>
  );
}

export const swipeStart = (exercise: Exercise): Phase[] => exercise.sets.map((s) => (s.done ? "complete" : "idle"));
export const SWIPE_STEPS: Phase[] = ["drag", "snapped", "inner", "full", "complete"];
// How long to hold each step before the next one starts.
export const stepMs = (step: Phase) => (step === "drag" ? PHASE_MS.drag + 150 : step === "snapped" ? 200 : PHASE_MS[step] + 50);

