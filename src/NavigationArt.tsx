import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { ProfileIcon } from "./content";
import type { createNavigationModel } from "./NavigationModels";
import NavigationArtFallback from "./NavigationArtFallback";

const DEG = Math.PI / 180;

export default function NavigationArt({ icon }: { icon: ProfileIcon }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [generation, setGeneration] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const card = host?.closest<HTMLAnchorElement>(".profile-card");
    if (!host || !card) return;
    host.dataset.ready = "false";
    host.dataset.motion = reduced ? "static" : "fallback";
    host.dataset.yaw = host.dataset.pitch = "0.000";
    host.dataset.highlight = "0.000";
    if (reduced) return;

    let disposed = false;
    let initializing = false;
    let failed = false;
    let lost = false;
    let nearby = false;
    let visible = false;
    let canvas: HTMLCanvasElement | undefined;
    let renderer: THREE.WebGLRenderer | undefined;
    let scene: THREE.Scene | undefined;
    let camera: THREE.PerspectiveCamera | undefined;
    let art: ReturnType<typeof createNavigationModel> | undefined;
    let pivot: THREE.Group | undefined;
    let raf = 0;
    let lastTime = 0;
    let elapsed = 0;
    let frames = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;
    let highlight = 0;
    let hovered = false;
    let focused = card.matches(":focus-visible");

    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
      if (!failed && !lost && renderer) host.dataset.motion = "paused";
    };

    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      pause();
      host.dataset.ready = "false";
      host.dataset.motion = "fallback";
    };
    const contextRestored = () => {
      if (!disposed) setGeneration(value => value + 1);
    };

    const release = () => {
      pause();
      canvas?.removeEventListener("webglcontextlost", contextLost);
      canvas?.removeEventListener("webglcontextrestored", contextRestored);
      art?.dispose();
      renderer?.dispose();
      canvas?.remove();
      art = undefined;
      renderer = undefined;
      canvas = undefined;
    };

    const fail = () => {
      failed = true;
      host.dataset.ready = "false";
      host.dataset.motion = "fallback";
      release();
    };

    const render = (now: number) => {
      raf = 0;
      if (disposed || failed || lost || !visible || document.hidden || !renderer || !scene || !camera || !art || !pivot || !canvas) return;
      if (lastTime && now - lastTime < 1000 / 30) {
        raf = requestAnimationFrame(render);
        return;
      }
      const delta = lastTime ? Math.min((now - lastTime) / 1000, .1) : 1 / 30;
      lastTime = now;
      elapsed += delta;
      const smoothing = 1 - Math.exp(-delta * 8);
      yaw += (targetYaw - yaw) * smoothing;
      pitch += (targetPitch - pitch) * smoothing;
      highlight += ((hovered || focused ? 1 : 0) - highlight) * smoothing;
      const phase = elapsed / 8 * Math.PI * 2;
      pivot.position.y = Math.sin(phase) * .035;
      pivot.rotation.set((pitch + Math.sin(phase) * 1.5) * DEG, (yaw + Math.sin(phase * .8) * 2.5) * DEG, 0);
      art.setHighlight(highlight);
      let shaderFailed = false;
      renderer.debug.onShaderError = () => { shaderFailed = true; };
      try {
        renderer.render(scene, camera);
        if (shaderFailed) { fail(); return; }
        if (lost || renderer.getContext().isContextLost()) return;
      } catch {
        fail();
        return;
      }
      canvas.dataset.rendered = "true";
      canvas.dataset.frame = String(++frames);
      host.dataset.yaw = yaw.toFixed(3);
      host.dataset.pitch = pitch.toFixed(3);
      host.dataset.highlight = highlight.toFixed(3);
      host.dataset.ready = "true";
      host.dataset.motion = "running";
      raf = requestAnimationFrame(render);
    };

    const start = () => {
      if (renderer && !raf && visible && !document.hidden && !lost && !failed && !disposed) {
        raf = requestAnimationFrame(render);
      }
    };

    const resize = () => {
      if (!renderer || !camera || lost) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      start();
    };

    const initialize = async () => {
      if (disposed || failed || initializing || renderer || !nearby || document.hidden) return;
      initializing = true;
      try {
        // Load Three.js and model geometry only when a card approaches the viewport.
        const [three, { createNavigationModel: createModel }] = await Promise.all([
          import("three"), import("./NavigationModels"),
        ]);
        if (disposed) return;
        canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
        if (!context) { fail(); return; }
        renderer = new three.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = three.SRGBColorSpace;
        scene = new three.Scene();
        camera = new three.PerspectiveCamera(34, 360 / 260, .1, 30);
        camera.position.z = 6.9;
        pivot = new three.Group();
        art = createModel(icon);
        pivot.add(art.model);
        scene.add(pivot);
        canvas.setAttribute("aria-hidden", "true");
        canvas.addEventListener("webglcontextlost", contextLost);
        canvas.addEventListener("webglcontextrestored", contextRestored);
        host.appendChild(canvas);
        host.dataset.motion = "paused";
        resize();
      } catch {
        if (!disposed) fail();
      } finally {
        initializing = false;
      }
    };

    const nearObserver = new IntersectionObserver(entries => {
      nearby = entries[0].isIntersecting;
      if (nearby) void initialize();
    }, { rootMargin: "160px" });
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else pause();
    });
    const sizeObserver = new ResizeObserver(resize);
    nearObserver.observe(host);
    visibilityObserver.observe(host);
    sizeObserver.observe(host);

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      hovered = true;
      targetYaw = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * 10;
      targetPitch = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * 6;
    };
    const leave = () => {
      hovered = false;
      targetYaw = targetPitch = 0;
    };
    const focus = () => { focused = card.matches(":focus-visible"); };
    const blur = () => { focused = false; leave(); };
    const visibility = () => {
      if (document.hidden) { leave(); pause(); }
      else { void initialize(); start(); }
    };
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerleave", leave);
    card.addEventListener("pointercancel", leave);
    card.addEventListener("focus", focus);
    card.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      disposed = true;
      nearObserver.disconnect();
      visibilityObserver.disconnect();
      sizeObserver.disconnect();
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("pointercancel", leave);
      card.removeEventListener("focus", focus);
      card.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      release();
    };
  }, [icon, reduced, generation]);

  return (
    <div className="profile-art" ref={hostRef} aria-hidden="true" data-icon={icon}>
      <NavigationArtFallback icon={icon} />
    </div>
  );
}
