import { useCallback, useEffect, useRef, useState } from "react";
import ReactBitsTopography from "./react-bits/Topography.jsx";

export interface TopographyProps {
  color?: string;
  lineCount?: number;
  lineWidth?: number;
  elevation?: number;
  foreground?: number;
  tilt?: number;
  speed?: number;
  direction?: "forward" | "backward" | "left" | "right";
  glow?: number;
  depthOfField?: number;
  fog?: number;
  hoverEffect?: "lift" | "trace" | "light";
  clickEffect?: "none" | "pulse" | "peak";
  majorLines?: boolean;
  scale?: number;
  detail?: number;
  morph?: number;
  brightness?: number;
  markers?: "none" | "dots" | "plus";
  glitch?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  parallax?: number;
  intro?: boolean;
  lightMode?: boolean;
}

function StaticContours({ count, major }: { count: number; major: boolean }) {
  return (
    <svg className="topography-fallback" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: count }, (_, i) => {
        const radius = 35 + i * 24;
        const points = Array.from({ length: 121 }, (_, j) => {
          const angle = (j / 120) * Math.PI * 2;
          const wave = 1 + .13 * Math.sin(angle * 3 + i * .08) + .08 * Math.cos(angle * 5);
          const x = 740 + Math.cos(angle) * radius * wave * 1.4;
          const y = 420 + Math.sin(angle) * radius * wave * .85;
          return `${j ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return <path key={i} d={`${points}Z`} fill="none" stroke="currentColor"
          strokeWidth={major && i % 5 === 0 ? 1.7 : 1} opacity={major && i % 5 === 0 ? .6 : .3} />;
      })}
    </svg>
  );
}

// Keep site lifecycle and fallback behavior separate from the registry renderer.
export default function Topography(props: TopographyProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [unavailable, setUnavailable] = useState(false);
  const color = props.color ?? "#fa0f0f";
  const count = Math.max(2, Math.min(80, Math.round(props.lineCount ?? 22)));
  const frameCount = useRef(0);

  const rendered = useCallback(() => {
    const host = hostRef.current;
    const canvas = host?.querySelector("canvas");
    if (!host || !canvas) return;
    canvas.dataset.rendered = "true";
    canvas.dataset.frame = String(++frameCount.current);
    host.dataset.ready = "true";
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = host?.querySelector("canvas");
    if (!host || !canvas) return;
    // The child paints synchronously during setup. A missing first paint means
    // WebGL 2 or shader initialization failed; retain the local SVG instead.
    if (canvas.dataset.rendered !== "true") {
      setUnavailable(true);
      return;
    }
    let visible = false;
    let lost = false;
    const sync = () => {
      host.dataset.motion = lost ? "fallback" : reducedMotion ? "static"
        : visible && !document.hidden ? "running" : "paused";
    };
    const contextLost = () => {
      lost = true;
      host.dataset.ready = "false";
      sync();
    };
    const contextRestored = () => { lost = false; sync(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(host);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reducedMotion, unavailable]);

  return (
    <div ref={hostRef} className="topography" aria-hidden="true"
      data-ready="false" data-motion="fallback" style={{ color }}>
      <StaticContours count={count} major={props.majorLines ?? true} />
      {!unavailable && <ReactBitsTopography
        key={String(reducedMotion)}
        {...props}
        color={color}
        lineCount={count}
        mouseInteraction={!reducedMotion && (props.mouseInteraction ?? true)}
        lightMode={false}
        onRender={rendered}
      />}
    </div>
  );
}
