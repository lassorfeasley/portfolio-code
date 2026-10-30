import type { CSSProperties } from 'react';

// Same drifting backdrop as the streamlined landing (lassor-streamlined's
// PageFlow): soft white and grey pools over a warm grey field, each on its own
// loop so the gradient never quite repeats.
type Pool = { x: number; y: number; size: number; mix: string; dx: string; dy: string; ms: number; delay: number };

const BG = '#f3f2ef';

const POOLS: Pool[] = [
  { x: -25, y: -30, size: 90, mix: 'white 100%', dx: '45%', dy: '35%', ms: 4, delay: 0 },
  { x: 50, y: 35, size: 95, mix: '#b4b3b0 100%', dx: '-45%', dy: '-30%', ms: 5, delay: -2 },
  { x: 60, y: -40, size: 70, mix: 'white 100%', dx: '-50%', dy: '45%', ms: 3.5, delay: -1 },
  { x: -30, y: 40, size: 75, mix: '#bfbebb 100%', dx: '50%', dy: '-35%', ms: 6, delay: -3 },
];

export default function PageFlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: BG }}>
      {POOLS.map((p) => (
        <div
          key={`${p.x},${p.y}`}
          className="page-flow absolute aspect-square rounded-full"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}%`,
              background: `radial-gradient(closest-side, color-mix(in oklab, ${BG}, ${p.mix}), transparent)`,
              '--flow-x': p.dx,
              '--flow-y': p.dy,
              '--flow-ms': `${p.ms}s`,
              '--flow-delay': `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
