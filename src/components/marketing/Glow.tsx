// A soft coloured glow behind content. A radial gradient, not a blurred
// element: CSS blur filters on large elements are expensive to paint on
// every scroll frame, a gradient costs nothing. `drift` lets it wander
// slowly (a transform animation on an inner element, so the positioning
// classes on the outer one are untouched). The default mint is the theme
// token, so it reads on the dark and the light site alike.
export default function Glow({ className = "", color = "rgb(var(--gp-mint) / 0.18)", drift }: { className?: string; color?: string; drift?: "a" | "b" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      <div className={`h-full w-full rounded-full ${drift === "a" ? "a-drift" : drift === "b" ? "a-drift-2" : ""}`} style={{ background: `radial-gradient(closest-side, ${color}, transparent 72%)` }} />
    </div>
  );
}
