// Swiper logo check used as the landing page backdrop: long arm at 60deg,
// short arm at 152deg, drawn far past the edges so only the arms show.
export default function HeroCheck({
  vertex,
  thickness,
  color = "#fbfbfa",
  className = "",
}: {
  vertex: [number, number];
  thickness: number;
  color?: string;
  className?: string;
}) {
  const [vx, vy] = vertex;
  const far = 3000;
  const tip = (deg: number) => `${vx + far * Math.cos((deg * Math.PI) / 180)},${vy - far * Math.sin((deg * Math.PI) / 180)}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    >
      <polyline
        points={`${tip(152)} ${vx},${vy} ${tip(60)}`}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinejoin="miter"
        strokeMiterlimit={4}
      />
    </svg>
  );
}
