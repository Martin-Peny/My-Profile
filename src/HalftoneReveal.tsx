import { useEffect, useRef, useState } from "react";
import "./HalftoneReveal.css";

// Shaders adapted from the user-supplied HalftoneReveal component.
const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const MASK = `#version 300 es
precision highp float;
uniform sampler2D uPrevious;
uniform vec2 uTexture;
uniform vec2 uView;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
out vec4 outColor;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTexture;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * uView;
  float trail = max(texture(uPrevious, uv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0);
  float brush = clamp((uRadius - segment(p, uFrom, uTo)) / band, 0.0, 1.0);
  brush = brush * brush * (3.0 - 2.0 * brush);
  outColor = vec4(max(trail, brush * uStrength), 0.0, 0.0, 1.0);
}`;

const VIEW = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uView;
uniform float uDpr;
uniform vec4 uFrame;
uniform float uTexels;
uniform float uMode;
uniform float uShape;
uniform float uCell;
uniform float uAngle;
uniform float uScale;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uPaper;
uniform float uContrast;
uniform float uBrightness;
uniform float uInvert;
uniform float uRough;
uniform float uShift;
uniform vec3 uMatte;
uniform float uKey;
uniform float uReverse;
uniform float uIntro;
uniform vec4 uBursts[4];
uniform float uBurstWidth;
out vec4 outColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec3 CYAN = vec3(0.0, 0.64, 0.93);
const vec3 MAGENTA = vec3(0.92, 0.07, 0.56);
const vec3 YELLOW = vec3(1.0, 0.91, 0.0);
const vec3 KEY = vec3(0.11, 0.1, 0.12);
const vec3 RED = vec3(1.0, 0.16, 0.12);
const vec3 GREEN = vec3(0.12, 1.0, 0.3);
const vec3 BLUE = vec3(0.16, 0.32, 1.0);

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec4 photo(vec2 p, float lod, float margin) {
  vec2 uv = (p - uFrame.xy) / uFrame.zw;
  vec4 c = textureLod(uImage, clamp(uv, 0.0, 1.0), lod);
  vec2 slack = margin * uCell / uFrame.zw;
  vec2 inside = step(-slack, uv) * step(uv, 1.0 + slack);
  float keep = inside.x * inside.y * c.a;
  keep *= mix(1.0, smoothstep(0.05, 0.2, distance(c.rgb, uMatte)), uKey);
  return vec4(c.rgb, keep);
}

float grade(float v) {
  v = clamp((v - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
  return mix(v, 1.0 - v, uInvert);
}

vec3 gradeColor(vec3 c) {
  return vec3(grade(c.r), grade(c.g), grade(c.b));
}

vec3 tone(vec3 c) {
  return pow(max(c, 0.0), vec3(1.5));
}

float press(float t, float alpha) {
  return (0.05 + clamp(t, 0.0, 1.0) * 0.89) * alpha;
}

float plate(float t, float alpha) {
  return (0.02 + clamp(t, 0.0, 1.0) * 0.92) * alpha;
}

vec3 decode(vec3 c) {
  return pow(max(c, 0.0), vec3(2.2));
}

vec4 separate(vec3 color) {
  vec3 target = clamp(tone(gradeColor(color)) / max(tone(uPaper), vec3(0.02)), 0.0, 1.0);
  vec3 absorbC = 1.0 - decode(CYAN);
  vec3 absorbM = 1.0 - decode(MAGENTA);
  vec3 absorbY = 1.0 - decode(YELLOW);
  float bright = pow(max(max(target.r, target.g), target.b), 0.4545);
  float key = pow(clamp(1.0 - bright / 0.62, 0.0, 1.0), 1.4) * 0.95;
  vec3 rest = clamp(target / max(1.0 - key * (1.0 - decode(KEY)), vec3(0.03)), 0.0, 1.0);
  vec3 a = 1.0 - rest;
  for (int i = 0; i < 3; i++) {
    vec3 tc = 1.0 - a.x * absorbC;
    vec3 tm = 1.0 - a.y * absorbM;
    vec3 ty = 1.0 - a.z * absorbY;
    mat3 slope = mat3(-absorbC * tm * ty, -absorbM * tc * ty, -absorbY * tc * tm);
    if (abs(determinant(slope)) < 1e-6) break;
    a = clamp(a - inverse(slope) * (tc * tm * ty - rest), 0.0, 1.0);
  }
  return vec4(a, key);
}

vec3 emit(vec3 color) {
  vec3 target = max(tone(gradeColor(color)) - tone(uPaper), 0.0);
  mat3 lights = mat3(decode(RED), decode(GREEN), decode(BLUE));
  return clamp(inverse(lights) * target, 0.0, 1.0);
}

float metric(vec2 f) {
  if (uShape < 0.5) return length(f);
  if (uShape < 1.5) return length(f * vec2(0.8, 1.15));
  if (uShape < 2.5) return max(abs(f.x), abs(f.y));
  if (uShape < 3.5) return abs(f.x) + abs(f.y);
  if (uShape < 4.5) return abs(f.y);
  return min(abs(f.x), abs(f.y));
}

float reach(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uShape < 0.5) return t < 0.785 ? sqrt(t / 3.14159) : mix(0.5, 0.72, (t - 0.785) / 0.215);
  if (uShape < 1.5) return t < 0.7 ? sqrt(t * 0.92 / 3.14159) : mix(0.4497, 0.72, (t - 0.7) / 0.3);
  if (uShape < 2.5) return 0.5 * sqrt(t) + 0.02 * t;
  if (uShape < 3.5) return t < 0.5 ? sqrt(t * 0.5) : 1.0 - sqrt((1.0 - t) * 0.5);
  if (uShape < 4.5) return 0.52 * t;
  return (1.0 - sqrt(1.0 - t)) * 0.5 + 0.02 * t;
}

vec2 center(vec2 p, float angle) {
  vec2 q = rotate(angle) * p / uCell;
  vec2 c = floor(q) + 0.5;
  if (uShape > 3.5 && uShape < 4.5) c.x = q.x;
  return rotate(-angle) * c * uCell;
}

float dots(vec2 p, float angle, float t, float seed, float grow) {
  vec2 q = rotate(angle) * p / uCell;
  float d = metric(fract(q) - 0.5);
  d += (noise(p * 0.42 + seed * 17.0) - 0.5) * uRough * 0.18;
  float r = reach(t) * uScale * grow;
  float w = max(fwidth(d), 0.0001) * 0.75;
  return (1.0 - smoothstep(r - w, r + w, d)) * clamp(r / (w * 2.0), 0.0, 1.0);
}

float coverage(vec4 image) {
  float shade = dot(tone(gradeColor(image.rgb)), LUMA);
  float paper = dot(tone(uPaper), LUMA);
  float span = dot(tone(uInk), LUMA) - paper;
  // On dark paper, dot density follows luminance independently of ink hue.
  float t = paper < 0.2 ? clamp((shade - paper) / max(1.0 - paper, 0.01), 0.0, 1.0)
    : abs(span) < 0.02 ? 1.0 - shade : (shade - paper) / span;
  return press(t, image.a);
}

float burst(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBursts[i];
    if (b.w <= 0.0) continue;
    float offset = distance(p, b.xy) - b.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * b.w);
  }
  return value;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  float lod = log2(max(uCell * uTexels, 1.0));
  float base = uAngle;
  vec2 drift = vec2(uShift, uShift * -0.6);

  vec2 field = p / max(uView.x, uView.y) - uView / max(uView.x, uView.y) * 0.5;
  float delay = length(field) * 1.15 + hash(floor(p / uCell)) * 0.06;
  float grow = smoothstep(0.0, 1.0, clamp((uIntro * 1.7 - delay) / 0.45, 0.0, 1.0));

  vec3 print = uPaper;
  if (uMode < 0.5) {
    float k = dots(p, base, coverage(photo(center(p, base), lod, 0.5)), 0.0, grow);
    print = mix(uPaper, uInk, k);
  } else if (uMode < 1.5) {
    float second = base + 0.5236;
    float tA = coverage(photo(center(p, base), lod, 0.5));
    float tB = coverage(photo(center(p + drift, second) - drift, lod, 0.5));
    float kA = dots(p, base, pow(tA, 1.9), 0.0, grow);
    float kB = dots(p + drift, second, clamp(tB * 1.3, 0.0, 1.0) * 0.8, 1.0, grow);
    if (dot(uPaper, LUMA) > 0.5) {
      print = uPaper * mix(vec3(1.0), uAccent, kB) * mix(vec3(1.0), uInk, kA);
    } else {
      print = min(uPaper + uAccent * kB + uInk * kA, vec3(1.0));
    }
  } else if (dot(uPaper, LUMA) > 0.5) {
    float ac = base - 0.5236;
    float am = base + 0.5236;
    float ay = base - 0.7854;
    vec4 sc = photo(center(p + drift, ac) - drift, lod, 0.5);
    vec4 sm = photo(center(p - drift, am) + drift, lod, 0.5);
    vec4 sy = photo(center(p + drift.yx, ay) - drift.yx, lod, 0.5);
    vec4 sk = photo(center(p, base), lod, 0.5);
    float kc = sc.a > 0.0 ? dots(p + drift, ac, plate(separate(sc.rgb).x, sc.a), 1.0, grow) : 0.0;
    float km = sm.a > 0.0 ? dots(p - drift, am, plate(separate(sm.rgb).y, sm.a), 2.0, grow) : 0.0;
    float ky = sy.a > 0.0 ? dots(p + drift.yx, ay, plate(separate(sy.rgb).z, sy.a), 3.0, grow) : 0.0;
    float kk = sk.a > 0.0 ? dots(p, base, plate(separate(sk.rgb).w, sk.a), 4.0, grow) : 0.0;
    print = uPaper;
    print *= mix(vec3(1.0), CYAN, kc);
    print *= mix(vec3(1.0), MAGENTA, km);
    print *= mix(vec3(1.0), YELLOW, ky);
    print *= mix(vec3(1.0), KEY, kk);
  } else {
    float ar = base - 0.5236;
    float ag = base + 0.5236;
    vec4 sr = photo(center(p + drift, ar) - drift, lod, 0.5);
    vec4 sg = photo(center(p - drift, ag) + drift, lod, 0.5);
    vec4 sb = photo(center(p, base), lod, 0.5);
    float kr = dots(p + drift, ar, plate(emit(sr.rgb).x, sr.a), 1.0, grow);
    float kg = dots(p - drift, ag, plate(emit(sg.rgb).y, sg.a), 2.0, grow);
    float kb = dots(p, base, plate(emit(sb.rgb).z, sb.a), 3.0, grow);
    print = min(uPaper + RED * kr + GREEN * kg + BLUE * kb, vec3(1.0));
  }

  vec2 maskUv = vec2(p.x / uView.x, 1.0 - p.y / uView.y);
  float shown = max(texture(uMask, maskUv).r, burst(p));
  shown = mix(shown, 1.0 - shown, uReverse);
  shown = shown * shown * (3.0 - 2.0 * shown);
  vec2 q = rotate(base) * p / uCell;
  float d = metric(fract(q) - 0.5);
  float r = reach(1.0) * 1.08 * shown;
  float w = max(fwidth(d), 0.0001) * 0.75;
  float k = (1.0 - smoothstep(r - w, r + w, d)) * clamp(r / (w * 2.0), 0.0, 1.0);
  vec4 sharp = photo(p, 0.0, 0.0);
  // Preserve the cutout in both print and reveal states, with premultiplied edges.
  outColor = vec4(mix(print, sharp.rgb, k) * sharp.a, sharp.a);
}`;


interface HalftoneRevealProps {
  src: string;
  alt: string;
  className?: string;
}

type MaskTarget = { texture: WebGLTexture; framebuffer: WebGLFramebuffer; width: number; height: number };
type Burst = { x: number; y: number; elapsed: number };
const INTRO_SECONDS = 1.4;
const BURST_SECONDS = 1.3;
const MAX_BURSTS = 4;

function makeProgram(gl: WebGL2RenderingContext, fragment: string) {
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) break;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) break;
    gl.attachShader(program, shader);
  }
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  shaders.forEach(shader => gl.deleteShader(shader));
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) {
  return Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
}

export default function HalftoneReveal({ src, alt, className = '' }: HalftoneRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    container.dataset.ready = 'false';
    container.dataset.running = 'false';
    const gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const maskProgram = makeProgram(gl, MASK);
    const viewProgram = makeProgram(gl, VIEW);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const imageTexture = gl.createTexture();
    const releaseBase = () => {
      gl.deleteProgram(maskProgram);
      gl.deleteProgram(viewProgram);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(imageTexture);
    };
    if (!maskProgram || !viewProgram || !vao || !buffer || !imageTexture) {
      releaseBase();
      return;
    }
    const mu = uniforms(gl, maskProgram, ['uPrevious', 'uTexture', 'uView', 'uFrom', 'uTo', 'uRadius', 'uSoftness', 'uStrength', 'uFade']);
    const vu = uniforms(gl, viewProgram, ['uImage', 'uMask', 'uResolution', 'uView', 'uDpr', 'uFrame', 'uTexels', 'uMode', 'uShape', 'uCell', 'uAngle', 'uScale', 'uInk', 'uAccent', 'uPaper', 'uContrast', 'uBrightness', 'uInvert', 'uRough', 'uShift', 'uMatte', 'uKey', 'uReverse', 'uIntro', 'uBursts[0]', 'uBurstWidth']);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const floatMask = !!gl.getExtension('EXT_color_buffer_float');
    const masks: MaskTarget[] = [];
    const destroyMasks = () => {
      masks.forEach(target => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      masks.length = 0;
    };
    const createMask = (width: number, height: number) => {
      const texture = gl.createTexture();
      const framebuffer = gl.createFramebuffer();
      if (!texture || !framebuffer) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        throw new Error('Unable to allocate reveal mask');
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, floatMask ? gl.RGBA16F : gl.RGBA8, width, height, 0, gl.RGBA, floatMask ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (!complete) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        throw new Error('Reveal framebuffer is unavailable');
      }
      return { texture, framebuffer, width, height };
    };

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionPreference.matches;
    container.dataset.motion = reduced ? 'static' : 'auto';
    let visible = false;
    let alive = true;
    let lost = false;
    let failed = false;
    let loaded = false;
    let raf = 0;
    let last = 0;
    let width = 1;
    let height = 1;
    let introElapsed = 0;
    let presence = 0;
    let trailRemaining = 0;
    let brushX = 0;
    let brushY = 0;
    let previousX = 0;
    let previousY = 0;
    const pointer = { x: 0, y: 0, inside: false, fresh: true };
    let touch: { id: number; x: number; y: number; started: number } | null = null;
    const bursts: Burst[] = [];
    const burstData = new Float32Array(MAX_BURSTS * 4);
    const image = new Image();
    image.decoding = 'async';

    const canRender = () => alive && !failed && !lost && loaded && visible && !document.hidden;
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      container.dataset.running = 'false';
    };
    const fail = () => {
      failed = true;
      stop();
      container.dataset.ready = 'false';
    };
    const clearTrails = () => {
      bursts.length = 0;
      burstData.fill(0);
      presence = 0;
      trailRemaining = 0;
      pointer.inside = false;
      pointer.fresh = true;
      masks.forEach(target => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    const draw = (dt: number) => {
      const radius = window.innerWidth <= 760 ? 96 : 160;
      const engaged = pointer.inside && !reduced;
      presence += ((engaged ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16));
      if (pointer.fresh) {
        brushX = previousX = pointer.x;
        brushY = previousY = pointer.y;
        pointer.fresh = false;
      } else {
        const follow = 1 - Math.exp(-dt / 0.035);
        brushX += (pointer.x - brushX) * follow;
        brushY += (pointer.y - brushY) * follow;
      }
      gl.bindVertexArray(vao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, masks[1].framebuffer);
      gl.viewport(0, 0, masks[1].width, masks[1].height);
      gl.useProgram(maskProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture);
      gl.uniform1i(mu.uPrevious, 0);
      gl.uniform2f(mu.uTexture, masks[1].width, masks[1].height);
      gl.uniform2f(mu.uView, width, height);
      gl.uniform2f(mu.uFrom, previousX, previousY);
      gl.uniform2f(mu.uTo, brushX, brushY);
      gl.uniform1f(mu.uRadius, radius * (0.45 + 0.55 * presence));
      gl.uniform1f(mu.uSoftness, 0.6);
      gl.uniform1f(mu.uStrength, reduced ? 0 : presence);
      gl.uniform1f(mu.uFade, Math.max(dt / 1.2, floatMask ? 0 : 1.5 / 255));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      masks.reverse();
      previousX = brushX;
      previousY = brushY;

      burstData.fill(0);
      for (let i = bursts.length - 1; i >= 0; i--) {
        bursts[i].elapsed += dt;
        if (bursts[i].elapsed >= BURST_SECONDS) bursts.splice(i, 1);
      }
      bursts.forEach((burst, i) => {
        const t = burst.elapsed / BURST_SECONDS;
        const reach = Math.hypot(Math.max(burst.x, width - burst.x), Math.max(burst.y, height - burst.y)) + 80;
        burstData.set([burst.x, burst.y, reach * Math.sin(t * Math.PI / 2), 1 - t * t * t], i * 4);
      });
      introElapsed = reduced ? INTRO_SECONDS : Math.min(INTRO_SECONDS, introElapsed + dt);
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const fw = image.naturalWidth * scale;
      const fh = image.naturalHeight * scale;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(viewProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(vu.uImage, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture);
      gl.uniform1i(vu.uMask, 1);
      gl.uniform2f(vu.uResolution, canvas.width, canvas.height);
      gl.uniform2f(vu.uView, width, height);
      gl.uniform1f(vu.uDpr, canvas.width / width);
      gl.uniform4f(vu.uFrame, (width - fw) / 2, (height - fh) / 2, fw, fh);
      gl.uniform1f(vu.uTexels, image.naturalWidth / fw);
      gl.uniform1f(vu.uMode, 0);
      gl.uniform1f(vu.uShape, 0);
      gl.uniform1f(vu.uCell, 6);
      gl.uniform1f(vu.uAngle, Math.PI / 4);
      gl.uniform1f(vu.uScale, 1);
      gl.uniform3f(vu.uInk, 250 / 255, 15 / 255, 15 / 255);
      gl.uniform3f(vu.uAccent, 1, 0.31, 0.16);
      gl.uniform3f(vu.uPaper, 8 / 255, 8 / 255, 8 / 255);
      gl.uniform1f(vu.uContrast, 1.1);
      gl.uniform1f(vu.uBrightness, 0);
      gl.uniform1f(vu.uInvert, 0);
      gl.uniform1f(vu.uRough, 0);
      gl.uniform1f(vu.uShift, 0);
      // The local asset already has an alpha matte; never color-key the person.
      gl.uniform3f(vu.uMatte, 0, 0, 0);
      gl.uniform1f(vu.uKey, 0);
      gl.uniform1f(vu.uReverse, 0);
      gl.uniform1f(vu.uIntro, 1 - (1 - introElapsed / INTRO_SECONDS) ** 2);
      gl.uniform4fv(vu['uBursts[0]'], burstData);
      gl.uniform1f(vu.uBurstWidth, Math.max(60, radius * 0.9));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      container.dataset.ready = 'true';
      trailRemaining = presence > 0.002 ? 1.4 : Math.max(0, trailRemaining - dt);
      return !reduced && (engaged || presence > 0.002 || trailRemaining > 0 || bursts.length > 0 || introElapsed < INTRO_SECONDS);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!canRender()) return stop();
      const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
      last = now;
      if (draw(dt)) {
        container.dataset.running = 'true';
        raf = requestAnimationFrame(frame);
      } else stop();
    };
    const wake = () => {
      if (!raf && canRender()) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      if (lost || failed) return;
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1_500_000 / (width * height)));
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const mw = Math.max(2, Math.round(width * 0.5));
      const mh = Math.max(2, Math.round(height * 0.5));
      if (masks[0]?.width !== mw || masks[0]?.height !== mh) {
        destroyMasks();
        try {
          masks.push(createMask(mw, mh));
          masks.push(createMask(mw, mh));
        } catch { fail(); destroyMasks(); return; }
        clearTrails();
      }
      wake();
    };
    image.onload = () => {
      if (!alive || lost || failed) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      loaded = true;
      wake();
    };
    image.onerror = fail;

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        if (touch && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 10) touch = null;
        return;
      }
      if (reduced) return;
      locate(event);
      if (!pointer.inside) pointer.fresh = true;
      pointer.inside = true;
      wake();
    };
    const onLeave = () => { pointer.inside = false; wake(); };
    const addBurst = () => {
      bursts.push({ x: pointer.x, y: pointer.y, elapsed: 0 });
      if (bursts.length > MAX_BURSTS) bursts.shift();
      wake();
    };
    const onDown = (event: PointerEvent) => {
      if (reduced || event.button !== 0) return;
      if (event.pointerType !== 'mouse') {
        touch = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now() };
      } else { onMove(event); addBurst(); }
    };
    const onUp = (event: PointerEvent) => {
      if (!reduced && touch?.id === event.pointerId && performance.now() - touch.started < 500 && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) <= 10) {
        locate(event);
        addBurst();
      }
      touch = null;
    };
    const onCancel = () => { touch = null; onLeave(); };
    const onVisibility = () => { if (document.hidden) stop(); else wake(); };
    const onMotionChange = () => {
      reduced = motionPreference.matches;
      container.dataset.motion = reduced ? 'static' : 'auto';
      stop();
      if (!lost && !failed) clearTrails();
      // Live preference changes never replay the entrance animation.
      introElapsed = INTRO_SECONDS;
      wake();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      stop();
      container.dataset.ready = 'false';
    };
    const onRestored = () => setGeneration(value => value + 1);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { pointer.inside = false; touch = null; stop(); }
      else wake();
    });
    const resizeObserver = new ResizeObserver(resize);
    container.addEventListener('pointerenter', onMove, { passive: true });
    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerleave', onLeave, { passive: true });
    container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerup', onUp, { passive: true });
    container.addEventListener('pointercancel', onCancel, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    motionPreference.addEventListener('change', onMotionChange);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    observer.observe(container);
    resizeObserver.observe(container);
    resize();
    image.src = src;

    return () => {
      alive = false;
      stop();
      container.dataset.ready = 'false';
      image.onload = null;
      image.onerror = null;
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointerenter', onMove);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('visibilitychange', onVisibility);
      motionPreference.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) { destroyMasks(); releaseBase(); }
    };
  }, [src, generation]);

  return (
    <div ref={containerRef} className={`halftone-reveal ${className}`.trim()} tabIndex={0} role="img" aria-label={alt}>
      <img className="halftone-reveal-photo" src={src} alt="" width={1080} height={1440} loading="lazy" decoding="async" />
      <canvas ref={canvasRef} className="halftone-reveal-canvas" aria-hidden="true" />
    </div>
  );
}
