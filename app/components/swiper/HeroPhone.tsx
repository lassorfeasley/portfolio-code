'use client';

import { useRef } from "react";
import { useInView, useReducedMotion } from "./motion";
import { CheckCircle2 } from "lucide-react";
import { BENCH, ExerciseCard, FLY, Gutter, PhoneFrame, SetCard, StatusBar, WorkoutHeader, type Exercise, type Phase } from "./phone";
import { doneSets, useExerciseTour, type TourState } from "./tour";

// The workout's exercise list as the scrub carousel shows it. Bench press and
// cable fly are live; the rest only need a name and how many sets are done.
const LIST: { name: string; sets: number; done: number }[] = [
  { name: "Push-ups", sets: 3, done: 3 },
  { name: "Bench press", sets: 3, done: 0 },
  { name: "Incline press", sets: 3, done: 0 },
  { name: "Chest dips", sets: 3, done: 0 },
  { name: "Skull crushers", sets: 3, done: 0 },
  { name: "Cable fly", sets: 3, done: 0 },
  { name: "Tricep pushdown", sets: 3, done: 0 },
];
const BENCH_AT = 1;
const FLY_AT = 5;

// Carousel geometry, after FocusedExerciseStage in the iOS app: a steady row
// pitch, the centered row a little below the card's title, and rows fading
// and shrinking with distance from center. The finger and list move 1:1.
const PITCH = 96;
const STAGE_TOP = 128;
const CENTER_Y = 300;
const FINGER_LOW = 620;

function Carousel({ state }: { state: TourState }) {
  const done = (i: number) => (i === BENCH_AT ? doneSets(state.a) : i === FLY_AT ? doneSets(state.b) : LIST[i].done);
  const exercisesDone = LIST.filter((e, i) => done(i) === e.sets).length;
  return (
    <div
      className="absolute inset-x-0 bottom-0 overflow-hidden transition-opacity duration-150"
      style={{ top: STAGE_TOP, opacity: state.scrubbing ? 1 : 0 }}
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{ transform: `translateY(${CENTER_Y - STAGE_TOP - state.progress * PITCH}px)` }}
      >
        {LIST.map((e, i) => {
          const distance = Math.abs(i - state.progress);
          const centered = i === Math.round(state.progress);
          return (
            <div
              key={e.name}
              className="absolute inset-x-0 pl-5 pr-[51px] origin-left"
              style={{
                top: i * PITCH,
                opacity: 1 - Math.min(0.7, distance * 0.3),
                transform: `scale(${1 - Math.min(0.08, distance * 0.04)})`,
              }}
            >
              <div
                className={`font-bold tracking-tight leading-[40px] transition-[font-size,color] duration-100 ${
                  centered ? "text-[30px] text-white" : "text-[24px] text-neutral-400"
                }`}
              >
                {e.name}
              </div>
              {done(i) === e.sets ? (
                <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#22c55e]">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  Complete
                </div>
              ) : (
                <div className="mt-1.5 flex gap-1.5">
                  {Array.from({ length: e.sets }, (_, j) => (
                    <span key={j} className={`size-[9px] rounded-full ${j < done(i) ? "bg-[#22c55e]" : "bg-white/[0.18]"}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 top-0 pl-5 pr-[51px] pt-2 pb-4 bg-gradient-to-b from-black via-black to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-extrabold tracking-[0.12em] text-white/70">TRAINING</span>
          <span className="text-[11px] font-semibold tabular-nums text-white/45">
            {exercisesDone}/{LIST.length}
          </span>
        </div>
        <div className="mt-2 h-px bg-white/15" />
      </div>
    </div>
  );
}

export default function HeroPhone({ scale = 1, crop = 0.72, className = "" }: { scale?: number; crop?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.3 });
  const reduceMotion = useReducedMotion();
  const state = useExerciseTour(visible && !reduceMotion, { a: BENCH, b: FLY, aAt: BENCH_AT, bAt: FLY_AT });
  const card = (exercise: Exercise, phases: Phase[], at: number) => (
    <div
      className="absolute inset-0 transition-opacity duration-200"
      style={{ opacity: !state.scrubbing && state.index === at ? 1 : 0 }}
    >
      <ExerciseCard
        exercise={exercise}
        renderSet={(i) => <SetCard phase={phases[i]} reps={exercise.sets[i].reps} weight={exercise.sets[i].weight} />}
      />
    </div>
  );
  // Dragging up moves down the list.
  const travel = (state.to - state.from) * PITCH;
  const fingerY = (state.to > state.from ? FINGER_LOW : FINGER_LOW + travel) - (state.progress - state.from) * PITCH;

  return (
    <PhoneFrame ref={ref} scale={scale} crop={crop} className={className}>
      <StatusBar />
      <Gutter active={state.scrubbing ? Math.round(state.progress) : state.index} count={LIST.length} />
      <WorkoutHeader exercise={BENCH} doneCount={doneSets(state.a) + doneSets(state.b)} />
      {card(BENCH, state.a, BENCH_AT)}
      {card(FLY, state.b, FLY_AT)}
      <Carousel state={state} />
      <span
        className="absolute z-40 left-[230px] top-0 size-12 -ml-6 -mt-6 rounded-full bg-white/40 ring-2 ring-white/70 pointer-events-none"
        style={{
          transform: `translateY(${fingerY}px)`,
          opacity: state.touch === "down" ? 1 : 0,
          transition: "opacity 180ms",
        }}
      />
    </PhoneFrame>
  );
}
