'use client';

import { forwardRef, type CSSProperties, type ReactNode } from "react";

// CSS 3D device bodies: front and back faces half the thickness either side of
// center, one flat wall per side covering the straight run between corners,
// and rounded slabs through the thickness that fill the corners.

export type Body = { w: number; h: number; r: number; t: number };
export type Side = "left" | "right" | "top" | "bottom";
// `from`/`to` run along the side from the top (left/right) or left (top/bottom).
export type Button = { side: Side; from: number; to: number; proud: number; width?: number; fill?: string };

// A light, stylized rail so the screen carries the contrast: nearly flat,
// with a slight roll-off toward the glass on either side. `t` runs 0 (back)
// to 1 (front).
const railLightness = (t: number) => 93 - 7 * Math.pow(Math.abs(t - 0.5) * 2, 3);
export const rail = (t: number, shade = 0) => `hsl(30 10% ${railLightness(t) + shade}%)`;
export const OUTLINE = "hsl(30 6% 72%)";
export const SHADOW = "rgb(41,37,36)";
const railGradient = (dir: string, shade: number) =>
  `linear-gradient(${dir}, ${[0, 0.08, 0.2, 0.5, 0.8, 0.92, 1].map((t) => `${rail(t, shade)} ${t * 100}%`).join(", ")})`;

const SLAB_STEP = 2.5;
const SHADE: Record<Side, number> = { left: 1.5, right: -1.5, top: 3, bottom: -4 };

function ButtonOnWall({ b, body, vertical }: { b: Button; body: Body; vertical: boolean }) {
  const width = body.t * (b.width ?? 0.4);
  const along = b.to - b.from;
  const face: CSSProperties = {
    borderRadius: Math.min(width, along) / 2,
    background: b.fill ?? rail(0.5),
    boxShadow: `inset 0 0 0 1.25px ${b.fill ? "rgba(0,0,0,0.12)" : OUTLINE}`,
  };
  const steps = Math.max(1, Math.ceil(b.proud / 2));
  const box: CSSProperties = vertical
    ? { left: (body.t - width) / 2, width, top: b.from - body.r, height: along }
    : { top: (body.t - width) / 2, height: width, left: b.from - body.r, width: along };
  return (
    <div className="absolute [transform-style:preserve-3d]" style={box}>
      {Array.from({ length: steps }, (_, i) => {
        const outer = i === steps - 1;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              ...face,
              boxShadow: outer ? face.boxShadow : undefined,
              transform: `translateZ(${((i + 1) / steps) * b.proud}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

function Wall({ side, body, buttons }: { side: Side; body: Body; buttons: Button[] }) {
  const { w, h, r, t } = body;
  const vertical = side === "left" || side === "right";
  const style: CSSProperties = vertical
    ? {
        left: (side === "left" ? 0 : w) - t / 2,
        top: r,
        width: t,
        height: h - 2 * r,
        transform: `rotateY(${side === "left" ? -90 : 90}deg)`,
        background: railGradient("90deg", SHADE[side]),
      }
    : {
        left: r,
        top: (side === "top" ? 0 : h) - t / 2,
        width: w - 2 * r,
        height: t,
        transform: `rotateX(${side === "top" ? 90 : -90}deg)`,
        background: railGradient("180deg", SHADE[side]),
      };
  return (
    <div className="absolute [transform-style:preserve-3d]" style={style}>
      {buttons
        .filter((b) => b.side === side)
        .map((b) => (
          <ButtonOnWall key={b.from} b={b} body={body} vertical={vertical} />
        ))}
    </div>
  );
}

// Each slab is only visible at the rounded corners (the walls cover the
// straight runs, the faces cover the middle), so it is drawn as four corner
// pieces. Full-size slabs each become a device-sized GPU layer, and dozens of
// them exhaust Safari's memory on iPhone.
const CORNERS: CSSProperties[] = [
  { left: 0.75, top: 0.75, borderTopLeftRadius: "100%" },
  { right: 0.75, top: 0.75, borderTopRightRadius: "100%" },
  { left: 0.75, bottom: 0.75, borderBottomLeftRadius: "100%" },
  { right: 0.75, bottom: 0.75, borderBottomRightRadius: "100%" },
];

export function DeviceBody({ body, buttons = [] }: { body: Body; buttons?: Button[] }) {
  const { r, t } = body;
  const steps = Math.ceil(t / SLAB_STEP);
  return (
    <>
      <div
        className="absolute inset-0 [backface-visibility:hidden]"
        style={{ borderRadius: r, background: rail(0.5), transform: `translateZ(${-t / 2}px) rotateY(180deg)` }}
      />
      {Array.from({ length: steps + 1 }, (_, i) => {
        const f = i / steps;
        return CORNERS.map((corner, c) => (
          <div
            key={`${i}-${c}`}
            className="absolute"
            style={{ ...corner, width: r, height: r, background: rail(f), transform: `translateZ(${(f - 0.5) * t}px)` }}
          />
        ));
      })}
      {(["left", "right", "top", "bottom"] as Side[]).map((s) => (
        <Wall key={s} side={s} body={body} buttons={buttons} />
      ))}
    </>
  );
}

// Positions a device of size `body` at (0, offsetY) inside a `width` x `height`
// stage, tilted toward the viewer. `mirror` turns it the other way and `roll`
// spins the whole tilted device clockwise in the page plane. Children are drawn
// in the device's own coordinates. `shadow` adds shapes beyond the body (such
// as a watch strap) to the cast shadow, also in device coordinates.
export const DeviceStage = forwardRef<
  HTMLDivElement,
  {
    body: Body;
    width: number;
    height: number;
    offsetY?: number;
    scale: number;
    mirror?: boolean;
    roll?: number;
    className?: string;
    shadow?: ReactNode;
    children: ReactNode;
  }
>(function DeviceStage(
  { body, width, height, offsetY = 0, scale, mirror = false, roll = 0, className = "", shadow, children },
  ref,
) {
  const turn = mirror ? -1 : 1;
  const place: CSSProperties = {
    left: (width - body.w) / 2,
    top: offsetY,
    width: body.w,
    height: body.h,
    transform: `rotateZ(${roll}deg) rotateX(18deg) rotateY(${-40 * turn}deg) rotateZ(${4 * turn}deg)`,
  };
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`relative ${className}`}
      style={{ width: width * scale, height: height * scale }}
    >
      {/* A static blurred silhouette instead of a drop-shadow filter, which
          would re-flatten and re-blur the animated 3D scene every frame. */}
      <div
        className="absolute inset-0"
        style={{
          perspective: 2600 * scale,
          filter: "blur(18px)",
          opacity: 0.16,
          transform: `translate(${-30 * turn}px, 40px)`,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left [transform-style:preserve-3d]"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <div className="absolute" style={{ ...place, borderRadius: body.r, background: SHADOW }}>
            {shadow}
          </div>
        </div>
      </div>
      <div className="absolute inset-0" style={{ perspective: 2600 * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left [transform-style:preserve-3d]"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <div
            className="absolute [transform-style:preserve-3d]"
            style={{ ...place, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});
