import type { Translate } from "./i18n";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { academicNotebook } from "./content";

function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Book textures require a 2D canvas.");
  paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Repeatable leather grain and paper fibres, generated locally without image requests.
function grainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(256, 256);
  let seed = 4026;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const shade = 90 + (seed >>> 24) * .3;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = shade;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}

function coverTexture(t: Translate) {
  return canvasTexture(768, 1080, (ctx) => {
    ctx.fillStyle = "#171416";
    ctx.fillRect(0, 0, 768, 1080);
    const light = ctx.createLinearGradient(0, 0, 768, 1080);
    light.addColorStop(0, "#ffffff0a");
    light.addColorStop(.3, "#ffffff00");
    light.addColorStop(1, "#00000025");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 768, 1080);
    // Fine red foil rules sit inside the binding; the cover stays mostly unprinted leather.
    ctx.strokeStyle = "#bc303a";
    ctx.lineWidth = 2;
    ctx.strokeRect(57, 48, 657, 984);
    ctx.strokeStyle = "#61242b";
    ctx.lineWidth = 1;
    ctx.strokeRect(67, 58, 637, 964);
    ctx.fillStyle = "#d3454e";
    ctx.font = '500 20px "IBM Plex Mono", monospace';
    ctx.fillText("HL / 05", 107, 123);
    ctx.textAlign = "right";
    ctx.fillText(t("VOL. 01"), 662, 123);
    ctx.textAlign = "left";
    ctx.font = '700 92px "Barlow Condensed", sans-serif';
    ctx.fillText(t("ACADEMIC"), 104, 322);
    ctx.font = '400 22px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#b7585d";
    ctx.fillText(t("F I E L D   N O T E S"), 110, 374);
    ctx.strokeStyle = "#aa3038";
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(109, 414); ctx.lineTo(657, 414); ctx.stroke();
    ctx.save();
    ctx.translate(387, 676);
    ctx.rotate(-.25);
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i === 1 ? "#c63843" : "#75313a";
      ctx.beginPath(); ctx.ellipse(0, 0, 174 - i * 22, 108 - i * 13, i * .3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-210, 0); ctx.lineTo(210, 0); ctx.moveTo(0, -165); ctx.lineTo(0, 165); ctx.stroke();
    ctx.fillStyle = "#be4148";
    for (const [x, y] of [[0, 0], [174, 0], [-174, 0], [0, 108], [0, -108]]) ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.restore();
    ctx.fillStyle = "#bc7377";
    ctx.font = '400 19px "IBM Plex Mono", monospace';
    ctx.fillText(t("HAOYANG LIN"), 109, 945);
    ctx.font = '400 14px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#895057";
    ctx.fillText(t("QUESTIONS / METHODS / EXPLORATION"), 109, 978);
    // Pressed hinge channel catches light differently from the flat front board.
    const crease = ctx.createLinearGradient(0, 0, 42, 0);
    crease.addColorStop(0, "#080607"); crease.addColorStop(.5, "#2b1a20"); crease.addColorStop(.72, "#080607"); crease.addColorStop(1, "#171416");
    ctx.fillStyle = crease;
    ctx.fillRect(0, 0, 42, 1080);
  });
}

function notebookTexture(page: number, t: Translate) {
  return canvasTexture(1440, 2040, ctx => {
    ctx.fillStyle = "#211a20";
    ctx.fillRect(0, 0, 1440, 2040);
    ctx.strokeStyle = "#62343f";
    ctx.strokeRect(50, 48, 1340, 1944);
    ctx.fillStyle = "#dc7e8b";
    ctx.font = '400 22px "IBM Plex Mono", sans-serif';
    ctx.fillText(t("HAOYANG LIN / FIELD NOTES"), 105, 110);
    const headings = ["Education", "Research Interests", "Research Projects", "Professional Experience"];
    type Line = { text: string; y: number; size: number; weight: number; color: string };
    const lines: Line[] = [];
    let y = 0;
    const paragraph = (source: string, size = 31, weight = 400, color = "#d1c4c8", gap = 18) => {
      const text = t(source);
      ctx.font = `${weight} ${size}px Arial, "Microsoft YaHei", sans-serif`;
      let line = "";
      // Preserve English words and allow natural wrapping between Chinese characters.
      const tokens = text.split(/(\s+|(?=[\u3400-\u9fff])|(?<=[\u3400-\u9fff]))/u).filter(Boolean);
      for (const token of tokens) {
        if (ctx.measureText(line + token).width > 1230 && line.trim() && !/^[，。；：！？、）》】”’]/u.test(token)) {
          lines.push({ text: line.trim(), y, size, weight, color });
          y += size * 1.5;
          line = token.trimStart();
        } else line += token;
      }
      if (line.trim()) {
        lines.push({ text: line.trim(), y, size, weight, color });
        y += size * 1.5;
      }
      y += gap;
    };
    paragraph(headings[page], 63, 700, "#f0dddc", 42);
    const { education, skills, interests, projects, experience } = academicNotebook;
    if (page === 0) {
      paragraph(education.university, 39, 700, "#e6ccd0");
      paragraph(education.degree, 32);
      paragraph(education.period, 27, 400, "#e5a3aa", 26);
      paragraph(education.courses, 31, 400, "#d1c4c8", 40);
      paragraph("Skills", 47, 700, "#f0dddc", 26);
      skills.forEach(skill => {
        paragraph(skill.title, 32, 700, "#e8c3ca", 4);
        paragraph(skill.description, 30, 400, "#d1c4c8", skill.note ? 5 : 24);
        if (skill.note) paragraph(skill.note, 26, 400, "#d9ac91", 24);
      });
    } else if (page === 1) {
      interests.forEach((interest, index) => {
        paragraph(`0${index + 1}`, 25, 400, "#ec7e8e", 10);
        paragraph(interest.title, 40, 700, "#e8c3ca", 18);
        paragraph(interest.description, 34, 400, "#d1c4c8", 68);
      });
    } else {
      (page === 2 ? projects : experience).forEach(item => {
        paragraph(item.title, 37, 700, "#e8c3ca", 10);
        paragraph(item.role, 29, 400, "#d9c2c8", 5);
        paragraph(`${t(item.period)}  |  ${t(item.location)}`, 26, 400, "#e5a3aa", 22);
        item.bullets.forEach(bullet => paragraph(`• ${t(bullet)}`, 30, 400, "#d1c4c8", 18));
        y += 30;
      });
    }
    // Fit the entire page, including the longer English resume, inside the printed frame.
    const scale = Math.min(1, 1660 / y);
    ctx.save();
    ctx.translate(105, 215);
    ctx.scale(scale, scale);
    lines.forEach(line => {
      ctx.font = `${line.weight} ${line.size}px Arial, "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, 0, line.y);
    });
    ctx.restore();
    ctx.fillStyle = "#d87583";
    ctx.fillRect(105, 1915, 40, 3);
    ctx.font = '400 23px "IBM Plex Mono", sans-serif';
    ctx.fillText(`0${page + 1} / 04`, 1190, 1940);
  });
}

function contactTexture() {
  return canvasTexture(128, 128, ctx => {
    const shade = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    shade.addColorStop(0, "#000000b0"); shade.addColorStop(.55, "#00000075"); shade.addColorStop(1, "#00000000");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 128, 128);
  });
}

export function createAcademicBook(t: Translate) {
  const model = new THREE.Group();
  const grain = grainTexture();
  const coverMap = coverTexture(t);
  const pageMaps = [0, 1, 2, 3].map(page => notebookTexture(page, t));
  const shadowMap = contactTexture();
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x242024, roughness: .76, metalness: .03, bumpMap: grain, bumpScale: .018, clearcoat: .12, clearcoatRoughness: .6 });
  const coverMaterial = new THREE.MeshPhysicalMaterial({ map: coverMap, color: 0xb3a0a5, roughness: .94, metalness: .02, bumpMap: grain, bumpScale: .008, clearcoat: .04, clearcoatRoughness: .8 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa72936, roughness: .47, metalness: .28, side: THREE.DoubleSide });
  const darkRed = new THREE.MeshStandardMaterial({ color: 0x391019, roughness: .74 });
  const paper = new THREE.MeshStandardMaterial({ color: 0x686263, roughness: .94 });
  const ink = new THREE.MeshStandardMaterial({ map: pageMaps[3], roughness: .94 });
  const lining = new THREE.MeshStandardMaterial({ map: pageMaps[0], roughness: .91 });
  const leafFront = new THREE.MeshStandardMaterial({ map: pageMaps[1], roughness: .94 });
  const leafBack = new THREE.MeshStandardMaterial({ map: pageMaps[2], roughness: .94 });

  function board(parent: THREE.Group, width: number, thickness: number, length: number, material: THREE.Material, x: number, y: number, z = 0) {
    const geometry = new RoundedBoxGeometry(width, thickness, length, 3, Math.min(.032, thickness * .35));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function face(parent: THREE.Group, material: THREE.Material, width: number, length: number, x: number, y: number, underside = false) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, length), material);
    plane.rotation.x = underside ? Math.PI / 2 : -Math.PI / 2;
    if (underside) plane.rotation.z = Math.PI;
    plane.position.set(x, y, 0);
    plane.receiveShadow = true;
    parent.add(plane);
    return plane;
  }

  // A portrait hardback: boards overhang the page block; individual signatures create visible fore-edges.
  const width = 3.25;
  const length = 4.65;
  board(model, width, .1, length, leather, 0, .085);
  for (let n = 0; n < 23; n++) {
    board(model, width - .15 + Math.sin(n * 1.7) * .008, .013, length - .16, paper, .075, .15 + n * .0136, .045);
  }
  face(model, ink, width - .18, length - .18, .025, .458);
  // Rounded bound spine and two subtle headbands, rather than a glowing strip.
  board(model, .18, .49, length, leather, -width / 2 + .035, .29);
  for (const z of [-length / 2 + .075, length / 2 - .075]) {
    board(model, .24, .044, .09, darkRed, -width / 2 + .11, .46, z);
    for (let i = 0; i < 5; i++) board(model, .013, .012, .06, red, -width / 2 + .025 + i * .032, .485, z);
  }

  const hinge = new THREE.Group();
  hinge.name = "front-cover-hinge";
  hinge.position.set(-width / 2, .52, 0);
  model.add(hinge);
  board(hinge, width, .095, length, leather, width / 2, 0);
  face(hinge, coverMaterial, width - .015, length - .016, width / 2, .049);
  face(hinge, lining, width - .18, length - .17, width / 2, -.05, true);
  // Binding seam and edge piping are geometry and share the light with the cover.
  for (const z of [-length / 2 + .015, length / 2 - .015]) board(hinge, width - .035, .012, .014, darkRed, width / 2, .034, z);
  board(hinge, .016, .015, length - .04, red, width - .025, .038);

  // One two-sided sheet reveals pages 3–4 as it turns from right to left.
  const leaf = new THREE.Group();
  leaf.name = "notebook-page-hinge";
  leaf.position.set(-width / 2 + .09, .8, 0);
  model.add(leaf);
  face(leaf, leafFront, width - .18, length - .18, (width - .18) / 2, .004);
  face(leaf, leafBack, width - .18, length - .18, (width - .18) / 2, -.004, true);

  // A ribbon bookmark exits at the bottom and rests on the mat.
  const ribbonShape = new THREE.Shape();
  ribbonShape.moveTo(-.09, 0); ribbonShape.lineTo(.09, 0); ribbonShape.lineTo(.085, .63);
  ribbonShape.lineTo(0, .56); ribbonShape.lineTo(-.085, .63); ribbonShape.closePath();
  const ribbon = new THREE.Mesh(new THREE.ShapeGeometry(ribbonShape), red);
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.set(.87, .075, length / 2 - .03);
  ribbon.castShadow = true;
  model.add(ribbon);

  const contact = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 5.5), new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(.5, -.018, .02);
  model.position.set(.5, .1, .02);
  model.rotation.set(.13, -.12, .045);
  let progress = 0;
  let lift = 0;
  let turn = 0;
  return {
    model,
    shadow: contact,
    update(open: boolean, hovered: boolean, reduced: boolean, dt: number, openScale = 2.05, spread = 0) {
      // A reversible 1.9-second journey: leave the desk, grow toward the reader, then unfold.
      const target = open ? 1 : 0;
      progress = reduced ? target : THREE.MathUtils.clamp(progress + (open ? dt : -dt) / 1.9, 0, 1);
      const flight = THREE.MathUtils.smootherstep(progress, 0, .85);
      const enlargement = THREE.MathUtils.smootherstep(progress, .25, 1);
      const openness = THREE.MathUtils.smootherstep(progress, .2, 1);
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 8);
      lift += ((hovered && !open ? 1 : 0) - lift) * blend;
      if (Math.abs(lift - (hovered && !open ? 1 : 0)) < .0008) lift = hovered && !open ? 1 : 0;
      hinge.rotation.z = openness * Math.PI * .985;
      turn = reduced ? spread : THREE.MathUtils.clamp(turn + Math.sign(spread - turn) * dt / .85, Math.min(turn, spread), Math.max(turn, spread));
      leaf.rotation.z = THREE.MathUtils.smootherstep(turn, 0, 1) * Math.PI;
      leaf.position.y = .475 + openness * (.03 + turn * .28);
      leaf.visible = progress > .8;
      model.position.set(.5 + openness * (openScale * 1.625 - .5), .1 + flight * 2.1 + lift * .16, .02 + flight * 1.15);
      model.scale.setScalar(1 + enlargement * (openScale - 1));
      model.rotation.set(.13 + flight * .45 + lift * .10, -.12 * (1 - flight), .045 * (1 - flight) + lift * .025);
      contact.material.opacity = 1 - flight * .8;
      contact.scale.setScalar(1 + flight * .28);
      return progress !== target || lift !== (hovered && !open ? 1 : 0) || turn !== spread;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      model.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
      geometries.forEach(geometry => geometry.dispose());
      contact.geometry.dispose();
      [grain, coverMap, ...pageMaps, shadowMap].forEach(texture => texture.dispose());
      [leather, coverMaterial, red, darkRed, paper, ink, lining, leafFront, leafBack, contact.material].forEach(material => material.dispose());
    },
  };
}
