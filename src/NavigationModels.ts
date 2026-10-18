import * as THREE from "three";
import type { ProfileIcon } from "./content";

type Point = [number, number, number];
const RED = 0xf23b3b;
const GRAY = 0x71817c;

export function createNavigationModel(icon: ProfileIcon) {
  const model = new THREE.Group();
  const red = new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: .9 });
  const gray = new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: .6 });
  const detail = new THREE.LineBasicMaterial({ color: 0x98a6a0, transparent: true, opacity: .76 });
  // Opaque dark surfaces hide rear lines without turning the models into bright solids.
  const surface = new THREE.MeshBasicMaterial({
    color: 0x121616, side: THREE.DoubleSide, polygonOffset: true,
    polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: RED, transparent: true, opacity: .1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  function line(parent: THREE.Object3D, points: Point[], material = gray) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const object = new THREE.Line(geometry, material);
    parent.add(object);
    return object;
  }

  function accent(parent: THREE.Object3D, points: Point[]) {
    line(parent, points, red);
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++) {
      path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i - 1]), new THREE.Vector3(...points[i])));
    }
    parent.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, points.length * 3), .018, 5, false), glowMaterial));
  }

  function box(parent: THREE.Object3D, width: number, height: number, depth: number, material = gray) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    parent.add(new THREE.Mesh(geometry, surface));
    const edges = new THREE.EdgesGeometry(geometry);
    parent.add(new THREE.LineSegments(edges, material));
  }

  function ring(parent: THREE.Object3D, radius: number, y: number, material = gray) {
    return line(parent, Array.from({ length: 81 }, (_, i): Point => {
      const angle = i / 80 * Math.PI * 2;
      return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    }), material);
  }

  if (icon === "profile") {
    model.rotation.set(-.12, -.38, -.12);
    for (let i = 2; i >= 0; i--) {
      const layer = new THREE.Group();
      layer.position.set(i * .19, -i * .06, -i * .28);
      model.add(layer);
      box(layer, 2.12, 2.65, .065, i === 1 ? red : gray);
      if (i !== 0) continue;
      accent(layer, [[-1.06, .94, .04], [-1.06, 1.325, .04], [-.61, 1.325, .04]]);
      accent(layer, [[1.06, -.94, .04], [1.06, -1.325, .04], [.61, -1.325, .04]]);
      line(layer, [[-.84, 1.08, .045], [-.22, 1.08, .045]], detail);
      line(layer, [[.57, 1.08, .045], [.85, 1.08, .045]], red);
      // A generic faceted profile is a symbol, not a reconstruction of the owner.
      const head: Point[] = [[-.32, .64, .1], [-.14, .84, .13], [.18, .81, .13], [.36, .58, .1], [.32, .23, .12], [.1, .03, .14], [-.16, .05, .14], [-.35, .3, .1], [-.32, .64, .1]];
      line(layer, head, detail);
      line(layer, [[-.32, .64, .1], [.02, .62, .25], [.36, .58, .1]], gray);
      line(layer, [[-.35, .3, .1], [.02, .31, .27], [.32, .23, .12]], gray);
      line(layer, [[-.14, .84, .13], [.02, .62, .25], [.02, .31, .27], [.1, .03, .14]], gray);
      line(layer, [[.18, .81, .13], [.02, .62, .25], [-.16, .05, .14]], gray);
      const shoulders: Point[] = [[-.16, .05, .14], [-.22, -.15, .12], [-.65, -.37, .1], [-.82, -.79, .07], [.84, -.79, .07], [.67, -.37, .1], [.28, -.14, .12], [.1, .03, .14]];
      line(layer, shoulders, detail);
      line(layer, [[-.65, -.37, .1], [-.02, -.45, .26], [.67, -.37, .1]], gray);
      line(layer, [[-.22, -.15, .12], [-.02, -.45, .26], [.28, -.14, .12]], gray);
      line(layer, [[-.02, -.45, .26], [0, -.79, .07]], gray);
      accent(layer, [[-.82, -.79, .07], [.84, -.79, .07]]);
      for (let n = 0; n < 8; n++) {
        const x = -.81 + n * .22;
        line(layer, [[x, -1.08, .05], [x + (n % 3 === 0 ? .08 : .14), -1.08, .05]], n < 3 ? red : gray);
      }
    }
    for (const x of [-1.06, 1.06]) {
      line(model, [[x, 1.325, 0], [x + .38, 1.205, -.56]], gray);
      line(model, [[x, -1.325, 0], [x + .38, -1.445, -.56]], gray);
    }
  } else if (icon === "microphone") {
    model.rotation.set(.16, -.18, -.43);
    const handle = new THREE.Group();
    handle.position.y = -.61;
    model.add(handle);
    const handleGeometry = new THREE.CylinderGeometry(.25, .15, 1.82, 12, 5);
    handle.add(new THREE.Mesh(handleGeometry, surface));
    // Explicit longitudinal/radial lines avoid the diagonals of a triangulated wireframe.
    for (let n = 0; n < 12; n++) {
      const a = n / 12 * Math.PI * 2;
      line(handle, [[Math.cos(a) * .253, .91, Math.sin(a) * .253], [Math.cos(a) * .153, -.91, Math.sin(a) * .153]], gray);
    }
    for (let n = 0; n < 6; n++) ring(handle, .153 + n * .02, -.91 + n * .364, gray);
    ring(model, .255, .31, red);
    ring(model, .26, .2, red);
    accent(model, Array.from({ length: 49 }, (_, n): Point => {
      const a = n / 48 * Math.PI * 2;
      return [Math.cos(a) * .26, .2, Math.sin(a) * .26];
    }));
    ring(model, .157, -1.52, red);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(.48, 28, 18), surface);
    grille.position.y = .85;
    grille.scale.y = 1.3;
    model.add(grille);
    for (let n = 1; n < 15; n++) {
      const angle = n / 15 * Math.PI;
      ring(model, Math.sin(angle) * .484, .85 + Math.cos(angle) * .628, n === 10 || n === 11 ? red : detail);
    }
    for (let n = 0; n < 12; n++) {
      const longitude = n / 12 * Math.PI * 2;
      line(model, Array.from({ length: 41 }, (_, j): Point => {
        const a = j / 40 * Math.PI;
        return [Math.sin(a) * Math.cos(longitude) * .484, .85 + Math.cos(a) * .628, Math.sin(a) * Math.sin(longitude) * .484];
      }), gray);
    }
    // The tilted orbit is spatial and stays separate from the microphone silhouette.
    const orbit = new THREE.Group();
    orbit.rotation.set(.65, .2, -.25);
    model.add(orbit);
    const orbitLine = ring(orbit, 1.42, 0, red);
    orbitLine.scale.set(1, 1, .68);
    for (const y of [-1.73, 1.7]) line(model, [[0, y, 0], [0, y + .13, 0]], gray);
  } else {
    model.rotation.set(.38, -.16, -.08);
    for (const side of [-1, 1]) {
      const page = new THREE.Group();
      page.rotation.y = -side * .3;
      model.add(page);
      const stack = new THREE.Group();
      stack.position.set(side * .88, 0, -.065);
      page.add(stack);
      box(stack, 1.68, 2.3, .22, detail);
      for (let n = 0; n < 5; n++) {
        const z = -.16 + n * .045;
        line(page, [[side * .06, -1.15, z], [side * 1.72, -1.15, z], [side * 1.72, 1.15, z]], gray);
      }
      const cover = new THREE.Group();
      cover.position.set(side * .9, -.015, -.225);
      page.add(cover);
      box(cover, 1.8, 2.4, .045, red);
      accent(page, [[side * .03, 1.2, -.2], [side * 1.8, 1.2, -.2], [side * 1.8, -1.2, -.2], [side * .03, -1.2, -.2]]);
      for (let n = 0; n < 10; n++) {
        const y = .88 - n * .18;
        line(page, [[side * .25, y, .055], [side * (n === 9 ? 1.08 : 1.47), y, .055]], n === 2 || n === 6 ? red : gray);
      }
      line(page, [[side * .25, 1.03, .055], [side * .76, 1.03, .055]], detail);
    }
    accent(model, [[0, 1.2, -.2], [0, -1.2, -.2]]);
    line(model, [[-.055, 1.15, .02], [-.055, -1.15, .02]], red);
    line(model, [[.055, 1.15, .02], [.055, -1.15, .02]], red);
  }

  return {
    model,
    setHighlight(value: number) {
      red.opacity = .82 + value * .18;
      glowMaterial.opacity = .08 + value * .12;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      model.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) geometries.add(object.geometry);
      });
      geometries.forEach(geometry => geometry.dispose());
      red.dispose();
      gray.dispose();
      detail.dispose();
      surface.dispose();
      glowMaterial.dispose();
    },
  };
}
