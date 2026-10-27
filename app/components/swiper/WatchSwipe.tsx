'use client';

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useInView, useReducedMotion } from "./motion";
import { DeviceBody, DeviceStage, OUTLINE, SHADOW, rail, type Body, type Button } from "./device";
import { CheckCircle2 } from "lucide-react";
import { GlassSheen, HAMMER, PULLDOWN, SetCard, type Exercise, type Phase, type Track } from "./phone";
import { doneSets, useExerciseTour, type TourState } from "./tour";

// The watchOS exercise page (marketing/app-store/screens/watch-exercise.png),
// in the capture's own 422 x 514 pixels, inside a generic slim smartwatch
// drawn in the same material as the phone frame.
const SCREEN = { w: 422, h: 514, r: 104 };
const BORDER = 22;
const BODY: Body = { w: SCREEN.w + 2 * BORDER, h: SCREEN.h + 2 * BORDER, r: SCREEN.r + BORDER, t: 64 };
const buttons = (progress: number): Button[] => [
  { side: "right", from: 170, to: 240, proud: 7, width: 0.5, fill: crownFill(progress) },
  { side: "right", from: 300, to: 380, proud: 1.5, width: 0.32 },
];
const BAND = { w: 286, t: 11, segment: 30, segments: 18, bend: 2, z: -BODY.t * 0.1 };
const BAND_ROOM = 150;

const WATCH_TRACK: Track = { w: 370, h: 72, pad: 8, r: 18, thumbW: 80, thumbR: 14 };
const setTop = (i: number) => 97 + i * 114;

const LIST: { name: string; sets: number; done: number }[] = [
  { name: "Deadlift", sets: 3, done: 3 },
  { name: "Lat pulldown", sets: 3, done: 0 },
  { name: "Seated row", sets: 3, done: 0 },
  { name: "Face pulls", sets: 3, done: 0 },
  { name: "Rear delt fly", sets: 3, done: 0 },
  { name: "Hammer curl", sets: 3, done: 0 },
  { name: "Bicep curl", sets: 3, done: 0 },
];
const PULLDOWN_AT = 1;
const HAMMER_AT = 5;
const WATCH_PITCH = 110;

// Knurling on the crown that rolls with the carousel, so the turn reads.
const crownFill = (progress: number) =>
  `linear-gradient(180deg, ${rail(0.5, 3)} 0 50%, ${rail(0.5, -6)} 50% 100%) 0 ${progress * 26}px / 100% 7px repeat`;

// A strap built from short slabs, each bent a little further back, so it
// curves gently away behind the wrist. Each slab has a face on either side of
// the strap's thickness plus its two cut edges.
function Band({ side }: { side: "top" | "bottom" }) {
  const up = side === "top";
  const h = BAND.segment + 1;
  const face = (z: number, shade: number): CSSProperties => ({
    inset: 0,
    background: rail(0.5, shade),
    transform: `translateZ(${z}px)`,
  });
  const edge = (left: boolean): CSSProperties => ({
    top: 0,
    height: h,
    width: BAND.t,
    left: (left ? 0 : BAND.w) - BAND.t / 2,
    background: rail(0.5, left ? -2 : -7),
    boxShadow: `inset 0.75px 0 ${OUTLINE}, inset -0.75px 0 ${OUTLINE}`,
    transform: `rotateY(${left ? -90 : 90}deg)`,
  });
  const segment = (i: number): ReactNode => (
    <div
      className="absolute [transform-style:preserve-3d]"
      style={{
        left: 0,
        width: BAND.w,
        height: h,
        top: up ? -BAND.segment : BAND.segment,
        transformOrigin: up ? "50% 100%" : "50% 0%",
        transform: `rotateX(${up ? BAND.bend : -BAND.bend}deg)`,
      }}
    >
      <div className="absolute" style={face(-BAND.t / 2, -7)} />
      <div
        className="absolute"
        style={{ ...face(BAND.t / 2, -3), boxShadow: `inset 1px 0 ${OUTLINE}, inset -1px 0 ${OUTLINE}` }}
      />
      <div className="absolute" style={edge(true)} />
      <div className="absolute" style={edge(false)} />
      {i + 1 < BAND.segments && segment(i + 1)}
    </div>
  );
  return (
    <div
      className="absolute [transform-style:preserve-3d]"
      style={{
        left: (BODY.w - BAND.w) / 2,
        width: BAND.w,
        height: 0,
        top: up ? 0 : BODY.h - BAND.segment,
        transform: `translateZ(${BAND.z}px)`,
      }}
    >
      {segment(0)}
    </div>
  );
}

function WatchCard({ exercise, phases, shown }: { exercise: Exercise; phases: Phase[]; shown: boolean }) {
  return (
    <div className="absolute inset-0 transition-opacity duration-200" style={{ opacity: shown ? 1 : 0 }}>
      <div className="absolute left-[40px] top-[16px] text-[32px] font-bold tracking-tight">{exercise.name}</div>
      {exercise.sets.map((set, i) => (
        <div key={i}>
          <div
            className="absolute left-[16px] text-[16px] font-bold tracking-[0.08em] text-neutral-400"
            style={{ top: setTop(i) - 23 }}
          >
            SET {i + 1}
          </div>
          <div className="absolute left-[16px]" style={{ top: setTop(i) }}>
            <SetCard watch track={WATCH_TRACK} phase={phases[i]} reps={set.reps} weight={set.weight} />
          </div>
        </div>
      ))}
    </div>
  );
}

// The crown carousel, after WatchExercisePager in the watch app (in the
// capture's 2x pixels): names a fixed pitch apart, the centered one in the
// card title's spot, neighbors dimming and shrinking with distance.
function WatchCarousel({ state }: { state: TourState }) {
  const done = (i: number) => (i === PULLDOWN_AT ? doneSets(state.a) : i === HAMMER_AT ? doneSets(state.b) : LIST[i].done);
  return (
    <div className="absolute inset-0 transition-opacity duration-150" style={{ opacity: state.scrubbing ? 1 : 0 }}>
      {LIST.map((e, i) => {
        const distance = Math.abs(i - state.progress);
        const centered = i === Math.round(state.progress);
        return (
          <div
            key={e.name}
            className="absolute left-[40px] right-[56px] origin-left"
            style={{
              top: 16 + (i - state.progress) * WATCH_PITCH,
              opacity: 1 - Math.min(0.6, distance * 0.55),
              transform: `scale(${1 - Math.min(0.08, distance * 0.08)})`,
            }}
          >
            <div className={`text-[32px] tracking-tight leading-[40px] ${centered ? "font-bold text-white" : "font-semibold text-neutral-400"}`}>
              {e.name}
            </div>
            {done(i) === e.sets ? (
              <div className="mt-2.5 flex items-center gap-2 text-[22px] font-semibold text-neutral-400">
                <CheckCircle2 size={24} strokeWidth={2.5} className="text-[#22c55e]" />
                Complete
              </div>
            ) : (
              <div className="mt-2.5 flex gap-3">
                {Array.from({ length: e.sets }, (_, j) => (
                  <span key={j} className={`size-[18px] rounded-full ${j < done(i) ? "bg-[#22c55e]" : "bg-white/[0.18]"}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WatchScreen({ state }: { state: TourState }) {
  const active = state.scrubbing ? Math.round(state.progress) : state.index;
  return (
    <>
      <WatchCard exercise={PULLDOWN} phases={state.a} shown={!state.scrubbing && state.index === PULLDOWN_AT} />
      <WatchCard exercise={HAMMER} phases={state.b} shown={!state.scrubbing && state.index === HAMMER_AT} />
      <WatchCarousel state={state} />
      <div className="absolute right-[36px] top-[38px] text-[33px] tabular-nums bg-black pl-2">10:10</div>
      <div className="absolute right-[16px] top-[150px] flex flex-col items-center gap-[9px]">
        {LIST.map((_, i) => (
          <span key={i} className={`size-[10px] rounded-full transition-colors duration-150 ${i === active ? "bg-white" : "bg-neutral-500"}`} />
        ))}
      </div>
      <span className="absolute right-[14px] top-[300px] text-[15px] font-bold tracking-[0.15em] text-neutral-400 [writing-mode:vertical-rl] rotate-180">
        TRAINING
      </span>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[14px] flex gap-[12px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`size-[11px] rounded-full ${i === 1 ? "bg-white" : "bg-neutral-600"}`} />
        ))}
      </div>
    </>
  );
}

export default function WatchSwipe({
  scale = 1,
  roll = 0,
  className = "",
}: {
  scale?: number;
  roll?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const state = useExerciseTour(visible && !reduceMotion, {
    a: PULLDOWN,
    b: HAMMER,
    aAt: PULLDOWN_AT,
    bAt: HAMMER_AT,
    startDelay: 900,
  });

  return (
    <DeviceStage
      ref={ref}
      body={BODY}
      width={BODY.w + 40}
      height={BODY.h + 2 * BAND_ROOM}
      offsetY={BAND_ROOM}
      scale={scale}
      roll={roll}
      className={className}
      shadow={
        <div
          className="absolute"
          style={{
            left: (BODY.w - BAND.w) / 2,
            width: BAND.w,
            top: -BAND.segment * BAND.segments,
            height: BODY.h + 2 * BAND.segment * BAND.segments,
            background: SHADOW,
          }}
        />
      }
    >
      <Band side="top" />
      <Band side="bottom" />
      <DeviceBody body={BODY} buttons={buttons(state.progress)} />
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
          <WatchScreen state={state} />
          <GlassSheen />
        </div>
      </div>
    </DeviceStage>
  );
}
