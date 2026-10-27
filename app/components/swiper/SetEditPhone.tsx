'use client';

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "./motion";
import { Check, Minus, Plus, Trash2, X } from "lucide-react";
import { PhoneFrame, CURL, SetCard, StatusBar, WorkoutScreen, setTop, sleep } from "./phone";

// The iOS Edit Set sheet (SwiftUI SetEditSheet, dark focused-workout style),
// opened from Set 3. Positions are in screen points; sheet rows are relative
// to SHEET_TOP.
const EDITED = 2;
const SHEET_TOP = 58;
const PAD = 16;
const ROW = { nav: 12, name: 76, type: 184, repsStepper: 262, weight: 346, weightStepper: 424, keep: 508 };
const PLUS_X = 440 - PAD - 30;
const MINUS_X = PAD + 30;

const SETS = CURL.sets;
const LOADED = { reps: SETS[EDITED].reps, weight: SETS[EDITED].weight, keep: 0 };
// `opened` is what the set held when the sheet opened, so Save only lights up
// once something has changed.
const START = { sheet: false, ...LOADED, opened: LOADED, saved: false };
type State = typeof START;
type Tap = { x: number; y: number; key: number };

const TARGETS = {
  set: { x: 330, y: setTop(EDITED) + 32 },
  repsPlus: { x: PLUS_X, y: SHEET_TOP + ROW.repsStepper + 26 },
  repsMinus: { x: MINUS_X, y: SHEET_TOP + ROW.repsStepper + 26 },
  weightPlus: { x: PLUS_X, y: SHEET_TOP + ROW.weightStepper + 26 },
  weightMinus: { x: MINUS_X, y: SHEET_TOP + ROW.weightStepper + 26 },
  keepToday: { x: PAD + 408 * 0.25, y: SHEET_TOP + ROW.keep + 24 + 22 },
  keepAlways: { x: PAD + 408 * 0.75, y: SHEET_TOP + ROW.keep + 24 + 22 },
  save: { x: 440 - PAD - 22, y: SHEET_TOP + ROW.nav + 22 },
};
type Target = keyof typeof TARGETS;

// Tap set 3, raise reps and weight, keep it permanently and save; then reopen
// it, put everything back as it loaded and save again, so the loop is seamless.
function useEditLoop(running: boolean) {
  const [state, setState] = useState<State>(START);
  const [tap, setTap] = useState<Tap | null>(null);
  const [pressed, setPressed] = useState<Target | null>(null);
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let key = 0;
    const update = (patch: Partial<State> | ((s: State) => Partial<State>)) =>
      !cancelled && setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
    const press = async (target: Target) => {
      setTap({ ...TARGETS[target], key: ++key });
      setPressed(target);
      await sleep(140);
      setPressed(null);
    };
    const edit = async (dir: 1 | -1, keep: number) => {
      await press("set");
      await sleep(250);
      update((s) => ({ sheet: true, opened: { reps: s.reps, weight: s.weight, keep: s.keep } }));
      await sleep(900);
      for (let i = 0; i < 2 && !cancelled; i++) {
        await press(dir > 0 ? "repsPlus" : "repsMinus");
        update((s) => ({ reps: s.reps + dir }));
        await sleep(380);
      }
      await sleep(300);
      for (let i = 0; i < 5 && !cancelled; i++) {
        await press(dir > 0 ? "weightPlus" : "weightMinus");
        update((s) => ({ weight: s.weight + dir }));
        await sleep(200);
      }
      await sleep(500);
      await press(keep ? "keepAlways" : "keepToday");
      update({ keep });
      await sleep(800);
      await press("save");
      await sleep(150);
      update({ sheet: false });
      await sleep(450);
      update({ saved: true });
      await sleep(1200);
      update({ saved: false });
    };
    (async () => {
      await sleep(1000);
      while (!cancelled) {
        await edit(1, 1);
        await sleep(1600);
        if (cancelled) return;
        await edit(-1, 0);
        await sleep(1800);
      }
    })();
    return () => {
      cancelled = true;
      setState(START);
      setTap(null);
      setPressed(null);
    };
  }, [running]);
  return { state, tap, pressed };
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[15px] text-neutral-400 mb-2">{children}</div>;
}

function TogglePicker({ options, selected }: { options: string[]; selected: number }) {
  return (
    <div className="relative h-11 rounded-lg bg-white/[0.08] ring-1 ring-inset ring-white/[0.12] flex overflow-hidden">
      <div
        className="absolute inset-y-0 bg-white transition-[left] duration-200 ease-out"
        style={{ width: `${100 / options.length}%`, left: `${(100 / options.length) * selected}%` }}
      />
      {options.map((o, i) => (
        <span
          key={o}
          className={`relative flex-1 flex items-center justify-center text-[15px] font-medium transition-colors duration-200 ${
            i === selected ? "text-black" : "text-white"
          }`}
        >
          {o}
        </span>
      ))}
    </div>
  );
}

function Stepper({ value, unit, pressed }: { value: number; unit: string; pressed: "plus" | "minus" | null }) {
  return (
    <div className="mt-2 h-[52px] rounded-lg ring-1 ring-inset ring-white/[0.12] flex overflow-hidden">
      <span
        className="w-[60px] flex items-center justify-center transition-colors duration-100"
        style={{ background: pressed === "minus" ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.14)" }}
      >
        <Minus size={22} strokeWidth={2.25} />
      </span>
      <span className="flex-1 flex flex-col items-center justify-center bg-white/[0.08] border-x border-white/[0.12] leading-none">
        <span className="text-[22px] font-bold tabular-nums">{value}</span>
        <span className="mt-1 text-[12px] text-neutral-400">{unit}</span>
      </span>
      <span
        className="w-[60px] flex items-center justify-center transition-colors duration-100"
        style={{ background: pressed === "plus" ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.14)" }}
      >
        <Plus size={22} strokeWidth={2.25} />
      </span>
    </div>
  );
}

function EditSetSheet({ state, pressed }: { state: State; pressed: string | null }) {
  const { opened } = state;
  const changed = state.reps !== opened.reps || state.weight !== opened.weight || state.keep !== opened.keep;
  const side = (field: "reps" | "weight") =>
    pressed === `${field}Plus` ? "plus" : pressed === `${field}Minus` ? "minus" : null;
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 rounded-t-[38px] bg-[#0b0b0b] ring-1 ring-white/10 transition-transform duration-[450ms] ease-[cubic-bezier(.32,.72,0,1)]"
      style={{ top: SHEET_TOP, transform: `translateY(${state.sheet ? 0 : 105}%)` }}
    >
      <div className="absolute inset-x-0 flex items-center justify-between" style={{ top: ROW.nav, paddingInline: PAD }}>
        <span className="size-11 rounded-full bg-white/[0.14] flex items-center justify-center text-neutral-400">
          <X size={18} strokeWidth={2.5} />
        </span>
        <span className="text-[17px] font-semibold">Edit Set</span>
        <span className="h-11 rounded-full bg-white/[0.14] flex items-center gap-1 px-1">
          <span className="size-9 flex items-center justify-center text-neutral-400">
            <Trash2 size={17} strokeWidth={2} />
          </span>
          <span
            className="size-9 rounded-full flex items-center justify-center transition-colors duration-150"
            style={{ background: pressed === "save" ? "rgba(255,255,255,0.3)" : "transparent", color: changed ? "#fff" : "#48484a" }}
          >
            <Check size={18} strokeWidth={3} />
          </span>
        </span>
      </div>

      <div className="absolute inset-x-0" style={{ top: ROW.name, paddingInline: PAD }}>
        <Label>Set name</Label>
        <div className="h-[52px] rounded-lg bg-white/[0.08] ring-1 ring-inset ring-white/[0.12] flex items-center px-4 text-[17px] text-neutral-500">
          Set {EDITED + 1}
        </div>
      </div>
      <div className="absolute inset-x-0 h-px bg-white/[0.12]" style={{ top: ROW.type - 16 }} />

      <div className="absolute inset-x-0" style={{ top: ROW.type, paddingInline: PAD }}>
        <Label>Set type</Label>
        <TogglePicker options={["Reps", "Timed"]} selected={0} />
        <Stepper value={state.reps} unit="Reps" pressed={side("reps")} />
      </div>
      <div className="absolute inset-x-0 h-px bg-white/[0.12]" style={{ top: ROW.weight - 16 }} />

      <div className="absolute inset-x-0" style={{ top: ROW.weight, paddingInline: PAD }}>
        <Label>Weight</Label>
        <TogglePicker options={["lbs", "kg", "body"]} selected={0} />
        <Stepper value={state.weight} unit="lbs" pressed={side("weight")} />
      </div>
      <div className="absolute inset-x-0 h-px bg-white/[0.12]" style={{ top: ROW.keep - 16 }} />

      <div className="absolute inset-x-0" style={{ top: ROW.keep, paddingInline: PAD }}>
        <Label>Keep new settings?</Label>
        <TogglePicker options={["Just for today", "Permanently"]} selected={state.keep} />
      </div>
    </div>
  );
}

export default function SetEditPhone({ scale = 1, crop = 0.74, className = "" }: { scale?: number; crop?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const loop = useEditLoop(visible && !reduceMotion);
  const state = reduceMotion ? { ...START, sheet: true, reps: START.reps + 2, weight: START.weight + 5, keep: 1 } : loop.state;

  return (
    <PhoneFrame ref={ref} scale={scale} crop={crop} mirror className={className}>
      <StatusBar />
      <div
        className="absolute inset-0 origin-top overflow-hidden transition-[transform,filter,border-radius] duration-[450ms] ease-[cubic-bezier(.32,.72,0,1)]"
        style={{
          transform: state.sheet ? "translateY(14px) scale(0.92)" : "none",
          filter: state.sheet ? "brightness(0.45)" : "none",
          borderRadius: state.sheet ? 28 : 0,
        }}
      >
        <WorkoutScreen
          exercise={CURL}
          doneCount={1}
          renderSet={(i) => (
            <SetCard
              phase={SETS[i].done ? "complete" : "idle"}
              reps={i === EDITED ? state.reps : SETS[i].reps}
              weight={i === EDITED ? state.weight : SETS[i].weight}
              highlight={i === EDITED && state.saved}
            />
          )}
        />
      </div>
      <EditSetSheet state={state} pressed={loop.pressed} />
      {loop.tap && (
        // Remounting on `key` restarts the CSS tap ripple (see featured-browser.css).
        <span
          key={loop.tap.key}
          className="swiper-tap absolute z-40 size-12 -ml-6 -mt-6 rounded-full bg-white/40 ring-2 ring-white/70 pointer-events-none"
          style={{ left: loop.tap.x, top: loop.tap.y }}
        />
      )}
    </PhoneFrame>
  );
}
