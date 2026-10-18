import { useLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import PortraitFallback, { portraitDescription, portraitUrl } from "./PortraitFallback";

const DEG = Math.PI / 180;
const clamp = THREE.MathUtils.clamp;

export default function HeroPortrait() {
  const { t } = useLanguage();
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
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
    if (!host) return;
    setReady(false);
    host.dataset.ready = "false";
    host.dataset.motion = reduced ? "static" : "fallback";
    host.dataset.yaw = host.dataset.pitch = "0";
    if (reduced) return;

    let renderer: THREE.WebGLRenderer;
    // Avoid constructing a renderer when WebGL is unavailable.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
    if (!context) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
    camera.position.z = 4;
    const geometry = new THREE.PlaneGeometry(2 * 630 / 997, 2, 96, 152);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { photo: { value: null }, depth: { value: null } },
      vertexShader: `
        uniform sampler2D depth;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += (texture2D(depth, uv).r - 0.4) * 0.44;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D photo;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(photo, vUv);
          if (color.a < 0.012) discard;
          gl_FragColor = color;
          #include <colorspace_fragment>
        }`,
    });
    const portrait = new THREE.Mesh(geometry, material);
    scene.add(portrait);

    let disposed = false, loaded = false, lost = false, intersecting = true;
    let raf = 0, frameCount = 0, previousTime = 0;
    let yaw = 0, pitch = 0;
    let pointer: { id: number; x: number; y: number; touch: boolean; horizontal: boolean } | null = null;
    const textures = new Set<THREE.Texture>();
    const active = () => !disposed && !lost && loaded && intersecting && !document.hidden;
    const render = (time: number) => {
      raf = 0;
      if (!active()) return;
      const dt = Math.min((time - previousTime) / 1000 || 1 / 60, .05);
      previousTime = time;
      const ease = 1 - Math.exp(-12 * dt);
      portrait.rotation.y += (yaw * DEG - portrait.rotation.y) * ease;
      portrait.rotation.x += (pitch * DEG - portrait.rotation.x) * ease;
      const moving = Math.abs(portrait.rotation.y - yaw * DEG) > .00005 ||
        Math.abs(portrait.rotation.x - pitch * DEG) > .00005;
      if (!moving) portrait.rotation.set(pitch * DEG, yaw * DEG, 0);
      renderer.render(scene, camera);
      canvas.dataset.rendered = "true";
      canvas.dataset.frame = String(++frameCount);
      host.dataset.yaw = (portrait.rotation.y / DEG).toFixed(3);
      host.dataset.pitch = (portrait.rotation.x / DEG).toFixed(3);
      host.dataset.motion = moving ? "running" : "idle";
      if (host.dataset.ready !== "true") {
        host.dataset.ready = "true";
        setReady(true);
      }
      if (moving) draw();
    };
    const draw = () => { if (active() && !raf) raf = requestAnimationFrame(render); };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (loaded && !lost) host.dataset.motion = "paused";
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const halfHeight = Math.max(1, (630 / 997) / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      draw();
    };
    const load = (url: string) => new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(url, texture => {
        if (disposed) { texture.dispose(); reject(new Error("unmounted")); return; }
        textures.add(texture);
        resolve(texture);
      }, undefined, reject);
    });
    void Promise.all([load(portraitUrl), load(`${import.meta.env.BASE_URL}images/hero-portrait-depth.png`)])
      .then(([photo, depth]) => {
        if (disposed || lost) return;
        photo.colorSpace = THREE.SRGBColorSpace;
        material.uniforms.photo.value = photo;
        material.uniforms.depth.value = depth;
        loaded = true;
        resize();
      }).catch(() => { /* The visible photograph remains the fallback. */ });

    const reset = () => { yaw = pitch = 0; draw(); };
    const finish = () => {
      const released = pointer;
      pointer = null;
      if (released && host.hasPointerCapture(released.id)) host.releasePointerCapture(released.id);
      host.dataset.dragging = "false";
      reset();
    };
    const down = (event: PointerEvent) => {
      if (!loaded || lost || event.button !== 0 || !event.isPrimary) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY,
        touch: event.pointerType === "touch", horizontal: false };
      // Capture on the same element from the start: transferring the touch's
      // implicit capture later would fire lostpointercapture on its child.
      // pan-y still lets the browser cancel capture for vertical scrolling.
      host.setPointerCapture(event.pointerId);
      host.dataset.dragging = "true";
    };
    const move = (event: PointerEvent) => {
      if (!loaded || lost) return;
      const rect = host.getBoundingClientRect();
      if (pointer) {
        if (event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
        if (pointer.touch && !pointer.horizontal) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { finish(); return; }
          if (Math.abs(dx) < 8) return;
          pointer.horizontal = true;
        }
        yaw = clamp(dx / rect.width * 30, -9, 9);
        pitch = pointer.touch ? 0 : clamp(dy / rect.height * 18, -5, 5);
      } else {
        if (event.pointerType === "touch") return;
        yaw = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1) * 4;
        pitch = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1) * 3;
      }
      draw();
    };
    const leave = () => { if (!pointer) reset(); };
    const key = (event: KeyboardEvent) => {
      if (!loaded || lost) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "Escape"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") yaw = clamp(yaw - 2, -9, 9);
      if (event.key === "ArrowRight") yaw = clamp(yaw + 2, -9, 9);
      if (event.key === "ArrowUp") pitch = clamp(pitch - 1, -5, 5);
      if (event.key === "ArrowDown") pitch = clamp(pitch + 1, -5, 5);
      if (event.key === "Home" || event.key === "Escape") reset();
      draw();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      finish();
      pause();
      host.dataset.ready = "false";
      host.dataset.motion = "fallback";
      setReady(false);
    };
    const onRestored = () => setGeneration(value => value + 1);
    const visibility = () => { finish(); if (document.hidden) pause(); else draw(); };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver(entries => {
      intersecting = entries[0].isIntersecting;
      if (intersecting) draw(); else { finish(); pause(); }
    });
    intersection.observe(host);
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointerup", finish);
    host.addEventListener("pointercancel", finish);
    host.addEventListener("lostpointercapture", finish);
    host.addEventListener("keydown", key);
    host.addEventListener("focusout", finish);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    document.addEventListener("visibilitychange", visibility);
    resize();

    return () => {
      disposed = true;
      finish();
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerup", finish);
      host.removeEventListener("pointercancel", finish);
      host.removeEventListener("lostpointercapture", finish);
      host.removeEventListener("keydown", key);
      host.removeEventListener("focusout", finish);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", visibility);
      geometry.dispose();
      material.dispose();
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [reduced, generation]);

  return <div className="hero-portrait" ref={hostRef} data-ready={ready}>
    <div className="portrait-interaction" role={ready ? "group" : undefined}
      aria-label={ready ? t(`Interactive portrait: ${portraitDescription}`) : undefined}
      aria-describedby={ready ? "portrait-help" : undefined} tabIndex={ready ? 0 : undefined} />
    <PortraitFallback />
    <span className="portrait-hint micro" id="portrait-help" hidden={!ready || reduced}>
      <span className="portrait-touch-hint">{t("DRAG TO EXPLORE")}</span>
      <span className="portrait-mouse-hint">{t("MOVE / DRAG TO EXPLORE")}</span>
      <span className="sr-only">{t(". Arrow keys to rotate. Home or Escape to reset.")}</span>
    </span>
  </div>;
}
