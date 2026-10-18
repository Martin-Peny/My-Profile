import { useLanguage, type Translate } from "./i18n";
import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createAcademicBook } from "./AcademicBookModel";

function makeMaterial(color: number, roughness = .42, metalness = .32) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMic(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(-3.45, .34, 3.35);
  group.scale.setScalar(.68);
  group.rotation.set(0, -.30, -.045);
  const dark = makeMaterial(0x211b20, .62, .22);
  const steel = makeMaterial(0x4c4249, .62, .36);
  const red = makeMaterial(0xa52c3b, .56, .2);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.22, .29, 2.55, 32), dark);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.44, 36, 24), dark);
  head.scale.x = 1.14;
  head.position.x = -1.53;
  group.add(head);
  // The grille follows the spherical head instead of wrapping an unrelated cylinder.
  for (let i = 1; i < 17; i++) {
    const angle = i / 18 * Math.PI;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(angle) * .445, .006, 4, 40), steel);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = -1.53 + Math.cos(angle) * .505;
    group.add(ring);
  }
  for (let i = 0; i < 12; i++) {
    const longitude = i / 12 * Math.PI * 2;
    const points = Array.from({ length: 33 }, (_, j) => {
      const a = j / 32 * Math.PI;
      return new THREE.Vector3(-1.53 + Math.cos(a) * .505, Math.sin(a) * Math.cos(longitude) * .445, Math.sin(a) * Math.sin(longitude) * .445);
    });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x64515b })));
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.29, .023, 8, 40), red);
  collar.rotation.y = Math.PI / 2;
  collar.position.x = -1.08;
  group.add(collar);
  const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(.38, .025, .13), steel);
  switchPlate.position.set(-.1, .27, 0);
  group.add(switchPlate);
  const switchButton = new THREE.Mesh(new THREE.BoxGeometry(.12, .03, .09), dark);
  switchButton.position.set(.02, .29, 0);
  group.add(switchButton);
  const cablePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.27, 0, 0), new THREE.Vector3(1.55, -.2, .02),
    new THREE.Vector3(1.9, -.38, .25), new THREE.Vector3(2.1, -.4, .7),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(cablePath, 24, .025, 6, false), red));
  scene.add(group);
  return { model: group, dispose: () => {
    const materials = new Set<THREE.Material>();
    group.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
        else materials.add(object.material);
      }
    });
    materials.forEach(material => material.dispose());
  } };
}

function addHeadphones(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(3.5, .16, -3.35);
  group.scale.setScalar(.67);
  group.rotation.y = -.20;
  const dark = makeMaterial(0x211b20, .62, .22);
  const cushion = makeMaterial(0x2d252b, .94, .03);
  const steel = makeMaterial(0x4c4249, .62, .36);
  const red = makeMaterial(0xa52c3b, .56, .2);
  const archPoints = (start: number, end: number, radius: number, y: number) => Array.from({ length: 41 }, (_, i) => {
    const angle = start + i / 40 * (end - start);
    return new THREE.Vector3(Math.cos(angle) * radius, y, -Math.sin(angle) * radius);
  });
  const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints(0, Math.PI, 1.4, .3)), 56, .105, 12, false), steel);
  group.add(band);
  const padding = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints(.4, Math.PI - .4, 1.4, .33)), 48, .165, 12, false), cushion);
  group.add(padding);
  const piping = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints(.42, Math.PI - .42, 1.55, .39)), 48, .012, 6, false), red);
  group.add(piping);
  for (const x of [-1.38, 1.38]) {
    const connector = new THREE.Mesh(new THREE.BoxGeometry(.09, .1, .43), steel);
    connector.position.set(x, .28, .14);
    group.add(connector);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.43, .46, .26, 40), dark);
    cup.position.set(x, .22, .56);
    cup.scale.z = 1.22;
    group.add(cup);
    const cushionRing = new THREE.Mesh(new THREE.TorusGeometry(.31, .09, 12, 40), cushion);
    cushionRing.rotation.x = -Math.PI / 2;
    cushionRing.scale.y = 1.22;
    cushionRing.position.set(x, .36, .56);
    group.add(cushionRing);
    const accent = new THREE.Mesh(new THREE.TorusGeometry(.424, .011, 6, 40), red);
    accent.rotation.x = -Math.PI / 2;
    accent.scale.y = 1.22;
    accent.position.set(x, .29, .56);
    group.add(accent);
  }
  const cable = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, .1, 1.1), new THREE.Vector3(-1.2, .02, 1.6),
    new THREE.Vector3(-.15, .02, 1.7), new THREE.Vector3(.5, .02, 1.3),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 32, .018, 6, false), red));
  scene.add(group);
  return { model: group, dispose: () => {
    group.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    dark.dispose(); cushion.dispose(); steel.dispose(); red.dispose();
  } };
}

function createDesk(t: Translate) {
  const desk = new THREE.Group();
  const surface = new THREE.Mesh(new RoundedBoxGeometry(10.8, .28, 10.2, 3, .08), makeMaterial(0x151416, .92, .04));
  surface.position.y = -.17;
  surface.receiveShadow = true;
  desk.add(surface);
  for (const x of [-4.45, 4.45]) {
    // Leave enough length below the front edge to read clearly from the high camera angle.
    const legGeometry = new RoundedBoxGeometry(.72, 4.8, .82, 3, .045);
    const leg = new THREE.Mesh(legGeometry, makeMaterial(0x191b1e, .96, .04));
    leg.position.set(x, -2.7, 4.68);
    desk.add(leg);
    const legEdges = new THREE.LineSegments(new THREE.EdgesGeometry(legGeometry, 30), new THREE.LineBasicMaterial({ color: 0x42464b, transparent: true, opacity: .36 }));
    legEdges.position.copy(leg.position);
    desk.add(legEdges);
  }
  const points: THREE.Vector3[] = [];
  // Both line families share the tabletop plane, so their intersections stay square in perspective.
  for (let x = -4.8; x <= 4.81; x += 1.2) points.push(new THREE.Vector3(x, -.022, -5), new THREE.Vector3(x, -.022, 5));
  for (let z = -4.8; z <= 4.81; z += 1.2) points.push(new THREE.Vector3(-5.3, -.022, z), new THREE.Vector3(5.3, -.022, z));
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x9d2733, transparent: true, opacity: .62 }));
  desk.add(grid);
  const edgeSource = new THREE.BoxGeometry(10.69, .23, 10.09);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(edgeSource), new THREE.LineBasicMaterial({ color: 0x65252e }));
  edgeSource.dispose();
  edge.position.y = -.17;
  desk.add(edge);
  const textures: THREE.Texture[] = [];
  for (const [x, z, angle, title] of [[-3.5, -3.25, -.16, "USER"], [3.4, 3.1, .14, "RESEARCH / LOG 02"]] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = 384; canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1b1519"; ctx.fillRect(0, 0, 384, 256);
    ctx.strokeStyle = "#703039"; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 380, 252);
    ctx.fillStyle = "#b37c85"; ctx.font = '20px "IBM Plex Mono", monospace'; ctx.fillText(t(title), 30, 52);
    ctx.strokeStyle = "#63323d"; ctx.lineWidth = 2;
    for (let y = 94; y <= 174; y += 40) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(285, y); ctx.stroke(); }
    ctx.fillStyle = "#e94551"; ctx.font = "36px sans-serif"; ctx.fillText("+", 316, 220);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.35, .025, .94), makeMaterial(0x1b1519, .9, 0));
    card.position.set(x, .012, z); card.rotation.y = angle;
    card.castShadow = card.receiveShadow = true;
    desk.add(card);
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.35, .94), new THREE.MeshStandardMaterial({ map: texture, roughness: .95 }));
    print.rotation.x = -Math.PI / 2; print.rotation.z = -angle;
    print.position.set(x, .027, z); print.receiveShadow = true;
    desk.add(print);
  }
  return { model: desk, dispose: () => {
    desk.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
    });
    textures.forEach(texture => texture.dispose());
  } };
}

export type DeskProp = "microphone" | "headphones";
export type AcademicTarget = "book" | "previousPage" | "nextPage" | "bookClose" | DeskProp;
type AcademicSceneProps = {
  open: boolean;
  spread: number;
  hovered: boolean;
  propHovered: DeskProp | null;
  targets: RefObject<Record<AcademicTarget, HTMLElement | null>>;
  onReadyChange: (ready: boolean) => void;
};

export default function AcademicScene({ open, spread, hovered, propHovered, targets, onReadyChange }: AcademicSceneProps) {
  const { t } = useLanguage();
  const hostRef = useRef<HTMLDivElement>(null);
  const inputs = useRef({ open, spread, hovered, propHovered });
  const invalidateRef = useRef<() => void>(() => {});
  const [generation, setGeneration] = useState(0);
  inputs.current = { open, spread, hovered, propHovered };
  useEffect(() => { invalidateRef.current(); }, [open, spread, hovered, propHovered]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    onReadyChange(false);
    let disposed = false;
    let visible = false;
    let initializing = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let book: ReturnType<typeof createAcademicBook> | undefined;
    const props: Array<{ name: DeskProp; model: THREE.Group; baseY: number; baseRotation: number; lift: number }> = [];
    let contextLost = false;
    let raf = 0;
    let lastTime = 0;
    let frames = 0;
    let renderSize = 0;
    let openScale = 2.35;
    const canvasScale = 1.5;
    const canvasMargin = (canvasScale - 1) / 2;
    const cleanups: Array<() => void> = [];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 50);
    camera.position.set(.65, 14, 9.2);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.HemisphereLight(0xe1e4eb, 0x191119, 1.65);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe9e0, 3.2);
    key.position.set(-3, 8, -4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -7;
    key.shadow.camera.right = key.shadow.camera.top = 7;
    key.shadow.normalBias = .018;
    key.shadow.bias = -.0002;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d9fa, .7);
    fill.position.set(5, 4, 2);
    scene.add(fill);
    // A low front fill exposes the matte legs beneath the tabletop's shadow.
    const legFill = new THREE.DirectionalLight(0xdce2e8, 2.4);
    legFill.position.set(0, -1, 10);
    legFill.target.position.set(0, -2.7, 4.68);
    scene.add(legFill, legFill.target);
    const redFill = new THREE.PointLight(0xe51e31, 9, 8, 2);
    redFill.position.set(-3, 2, 2);
    scene.add(redFill);
    const desk = createDesk(t);
    scene.add(desk.model);
    cleanups.push(desk.dispose);

    const point = new THREE.Vector3();
    const placeTarget = (name: "book" | DeskProp, model: THREE.Group) => {
      const target = targets.current[name];
      if (!target) return;
      let left = 1, top = 1, right = -1, bottom = -1;
      model.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh)) return;
        if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox!;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          point.set(x, y, z).applyMatrix4(object.matrixWorld).project(camera);
          left = Math.min(left, point.x); right = Math.max(right, point.x);
          top = Math.min(top, -point.y); bottom = Math.max(bottom, -point.y);
        }
      });
      target.style.left = `${(left + right + 2) * 25 * canvasScale - canvasMargin * 100}%`;
      target.style.top = `${(top + bottom + 2) * 25 * canvasScale - canvasMargin * 100}%`;
      target.style.width = `${(right - left) * 50 * canvasScale}%`;
      target.style.height = `${(bottom - top) * 50 * canvasScale}%`;
    };

    const placePageControls = () => {
      if (!book) return;
      const pageRegion = (name: AcademicTarget, minX: number, maxX: number, minZ: number, maxZ: number, height: number) => {
        const target = targets.current[name];
        if (!target) return;
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        for (const x of [minX, maxX]) for (const z of [minZ, maxZ]) {
          point.set(x, height, z).applyMatrix4(book!.model.matrixWorld).project(camera);
          const px = (point.x + 1) * .5 * canvasScale - canvasMargin;
          const py = (1 - point.y) * .5 * canvasScale - canvasMargin;
          left = Math.min(left, px); right = Math.max(right, px);
          top = Math.min(top, py); bottom = Math.max(bottom, py);
        }
        target.style.left = `${(left + right) * 50}%`;
        target.style.top = `${(top + bottom) * 50}%`;
        target.style.width = `${(right - left) * 100}%`;
        target.style.height = `${(bottom - top) * 100}%`;
      };
      pageRegion("previousPage", -4.55, -1.8, -1.95, 2.05, .77);
      pageRegion("nextPage", -1.35, 1.35, -1.6, 2.05, .52);
      pageRegion("bookClose", .7, 1.4, -2.16, -1.82, inputs.current.spread === 0 ? .505 : .458);
    };

    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
      host.dataset.motion = motion.matches ? "static" : "paused";
    };
    const draw = (time: number) => {
      raf = 0;
      if (disposed || contextLost || !visible || document.hidden || !renderer || !book) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 30;
      lastTime = time;
      let moving = book.update(inputs.current.open, inputs.current.hovered, motion.matches, dt, openScale, inputs.current.spread);
      for (const prop of props) {
        const target = inputs.current.propHovered === prop.name ? 1 : 0;
        prop.lift += (target - prop.lift) * (motion.matches ? 1 : 1 - Math.exp(-dt * 9));
        if (Math.abs(prop.lift - target) < .001) prop.lift = target;
        prop.model.position.y = prop.baseY + prop.lift * .23;
        prop.model.rotation.z = prop.baseRotation + (motion.matches ? 0 : prop.lift * .035);
        host.dataset[prop.name] = prop.lift.toFixed(3);
        moving ||= prop.lift !== target;
      }
      scene.updateMatrixWorld(true);
      placeTarget("book", book.model);
      placePageControls();
      props.forEach(prop => placeTarget(prop.name, prop.model));
      renderer.render(scene, camera);
      host.dataset.frames = String(++frames);
      host.dataset.open = String(inputs.current.open);
      host.dataset.motion = motion.matches ? "static" : moving ? "animating" : "idle";
      host.dataset.hinge = book.model.children.find(child => child.name === "front-cover-hinge")?.rotation.z.toFixed(3);
      host.dataset.bookHeight = book.model.position.y.toFixed(3);
      host.dataset.bookScale = book.model.scale.x.toFixed(3);
      host.dataset.spread = String(inputs.current.spread + 1);
      host.dataset.pageTurn = book.model.children.find(child => child.name === "notebook-page-hinge")?.rotation.z.toFixed(3);
      if (moving && !motion.matches) raf = requestAnimationFrame(draw);
      else lastTime = 0;
    };
    const invalidate = () => {
      if (!raf && !disposed && !contextLost && visible && !document.hidden && renderer && book) raf = requestAnimationFrame(draw);
    };
    invalidateRef.current = invalidate;
    const resize = () => {
      if (!renderer) return;
      const rect = host.getBoundingClientRect();
      const size = Math.max(1, Math.min(rect.width, rect.height));
      openScale = THREE.MathUtils.clamp(1.45 * (window.innerWidth - 32) / (size * .92), 1.45, 2.35);
      if (size !== renderSize) {
        renderSize = size;
        // Extend the camera's original view rather than enlarging the desk with the canvas.
        camera.setViewOffset(size, size, -size * canvasMargin, -size * canvasMargin, size * canvasScale, size * canvasScale);
        renderer.setSize(size * canvasScale, size * canvasScale, false);
        renderer.domElement.style.width = `${size * canvasScale}px`;
        renderer.domElement.style.height = `${size * canvasScale}px`;
      }
      invalidate();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      pause();
      onReadyChange(false);
    };
    const restored = () => { if (!disposed) setGeneration(value => value + 1); };
    const initialize = async () => {
      if (initializing || renderer || disposed) return;
      initializing = true;
      try {
        await document.fonts.load('700 32px "Barlow Condensed"');
        await document.fonts.load('400 16px "IBM Plex Mono"');
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.addEventListener("webglcontextlost", lost);
        renderer.domElement.addEventListener("webglcontextrestored", restored);
        host.appendChild(renderer.domElement);
        for (const [name, prop] of [["microphone", addMic(scene)], ["headphones", addHeadphones(scene)]] as const) {
          props.push({ name, model: prop.model, baseY: prop.model.position.y, baseRotation: prop.model.rotation.z, lift: 0 });
          cleanups.push(prop.dispose);
        }
        book = createAcademicBook(t);
        scene.add(book.model);
        scene.add(book.shadow);
        scene.traverse(object => {
          if (object instanceof THREE.Mesh && object !== book?.shadow && object !== desk.model.children[0]) object.castShadow = object.receiveShadow = true;
        });
        book.update(inputs.current.open, false, true, 1, openScale, inputs.current.spread);
        resize();
        renderer.render(scene, camera);
        onReadyChange(true);
        invalidate();
      } catch {
        onReadyChange(false);
        renderer?.domElement.remove();
      }
    };
    const nearObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void initialize();
    }, { rootMargin: "240px" });
    const visibilityObserver = new IntersectionObserver(entries => {
      // Closing the notes can queue an exit and re-entry in the same delivery.
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) invalidate(); else pause();
    });
    const sizeObserver = new ResizeObserver(resize);
    nearObserver.observe(host);
    visibilityObserver.observe(host);
    sizeObserver.observe(host);
    window.addEventListener("resize", resize);
    const visibility = () => { if (document.hidden) pause(); else invalidate(); };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", invalidate);
    return () => {
      disposed = true;
      pause();
      nearObserver.disconnect(); visibilityObserver.disconnect(); sizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", invalidate);
      invalidateRef.current = () => {};
      renderer?.domElement.removeEventListener("webglcontextlost", lost);
      renderer?.domElement.removeEventListener("webglcontextrestored", restored);
      cleanups.forEach((cleanup) => cleanup());
      book?.dispose();
      key.shadow.map?.dispose();
      ambient.dispose(); key.dispose(); fill.dispose(); legFill.dispose(); redFill.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [generation, onReadyChange, targets, t]);

  return <div className="academic-scene" ref={hostRef} aria-hidden="true" />;
}
