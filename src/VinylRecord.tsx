import { useEffect, useRef } from "react";
import "./VinylRecord.css";

export default function VinylRecord() {
  const recordRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const record = recordRef.current!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const syncPlayback = () => {
      record.dataset.running = String(visible && !document.hidden && !reducedMotion.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(record);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      record.dataset.running = "false";
    };
  }, []);
  return (
    <div className="vinyl-record" ref={recordRef} data-running="false" aria-hidden="true">
      <div className="gallery-vinyl">
        <div className="gallery-vinyl-disc"><span className="gallery-vinyl-label" /></div>
      </div>
    </div>
  );
}
