<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { soundStudies, type StudyId } from "./content";

const activeId = ref<StudyId>("pulse");
const active = computed(() =>
  soundStudies.find((study) => study.id === activeId.value)!,
);
const playing = ref(false);
const volume = ref(28);
const error = ref("");
const canvas = ref<HTMLCanvasElement | null>(null);
let context: AudioContext | undefined;
let master: GainNode | undefined;
let analyser: AnalyserNode | undefined;
let voices: AudioNode[] = [];
let timer: number | undefined;
let animation = 0;
let playRequest = 0;
let disposed = false;
let observer: ResizeObserver | undefined;
let beat = 0;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function stopVoices() {
  window.clearInterval(timer);
  voices.forEach((voice) => {
    if (voice instanceof OscillatorNode) {
      try {
        voice.stop();
      } catch {
        /* Already stopped one-shot. */
      }
    }
    voice.disconnect();
  });
  voices = [];
}

function createTone(
  frequency: number,
  waveform: OscillatorType,
  length: number,
  strength: number,
  delay = 0,
) {
  if (!context || !master) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = waveform;
  oscillator.frequency.value = frequency;
  filter.type = "lowpass";
  filter.frequency.value = activeId.value === "raw" ? 900 : 1600;
  const now = context.currentTime + delay;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(strength, now + 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + length);
  oscillator.connect(filter).connect(envelope).connect(master);
  oscillator.start(now);
  oscillator.stop(now + length + 0.05);
  voices.push(oscillator, envelope, filter);
  oscillator.onended = () => {
    [oscillator, envelope, filter].forEach((node) => node.disconnect());
    voices = voices.filter(
      (node) => node !== oscillator && node !== envelope && node !== filter,
    );
  };
}

function sequence() {
  const study = active.value;
  if (study.id === "drift") {
    createTone(study.frequency, "sine", 4, 0.28);
    createTone(study.frequency * 1.5, "sine", 3.6, 0.13, 0.3);
    createTone(study.frequency * 2.002, "sine", 3.2, 0.08, 0.8);
  } else {
    const notes =
      study.id === "raw"
        ? [1, 1, 1.1892, 0.75, 1, 1.5, 1.1892, 0.75]
        : [1, 1, 2, 1.5, 1, 1.25, 2, 1.5];
    createTone(
      study.frequency * notes[beat % notes.length],
      study.waveform,
      0.36,
      0.2,
    );
    if (beat % 2 === 0) createTone(55, "sine", 0.18, 0.36);
  }
  beat++;
}

async function start() {
  const request = ++playRequest;
  error.value = "";
  try {
    context ??= new AudioContext();
    if (!master) {
      master = context.createGain();
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      master.connect(analyser).connect(context.destination);
    }
    await context.resume();
    if (disposed || request !== playRequest) return;
    stopVoices();
    master.gain.setValueAtTime((volume.value / 100) * 0.5, context.currentTime);
    beat = 0;
    playing.value = true;
    sequence();
    timer = window.setInterval(
      sequence,
      activeId.value === "drift" ? 2800 : 60000 / active.value.bpm / 2,
    );
    draw();
  } catch {
    playing.value = false;
    error.value =
      "Audio is unavailable in this browser. Try a current version of Chrome, Edge, Firefox, or Safari.";
  }
}

function stop() {
  playRequest++;
  playing.value = false;
  stopVoices();
  if (context && master)
    master.gain.setTargetAtTime(0, context.currentTime, 0.025);
  draw();
}

function selectStudy(id: StudyId) {
  activeId.value = id;
  window.dispatchEvent(
    new CustomEvent<StudyId>("study-changed", { detail: id }),
  );
  if (playing.value) void start();
  else draw();
}

function changeVolume() {
  if (master && context)
    master.gain.setTargetAtTime(
      (volume.value / 100) * 0.5,
      context.currentTime,
      0.03,
    );
}

function draw() {
  cancelAnimationFrame(animation);
  const element = canvas.value;
  if (!element) return;
  const ctx = element.getContext("2d");
  if (!ctx) return;
  const w = element.width,
    h = element.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#4f5050";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  const data = new Uint8Array(analyser?.frequencyBinCount ?? 128);
  if (playing.value && analyser) analyser.getByteFrequencyData(data);
  const bars = 72;
  for (let i = 0; i < bars; i++) {
    const envelope = Math.sin((i / bars) * Math.PI);
    const resting =
      3 + Math.abs(Math.sin(i * 1.8) * Math.cos(i * 0.3)) * envelope * h * 0.55;
    const amplitude = playing.value
      ? 3 + (data[Math.floor((i * data.length) / bars)] / 255) * h * 0.85
      : resting;
    ctx.fillStyle = i > 54 ? "#696b6b" : "#ef3535";
    ctx.fillRect(
      (i * w) / bars,
      (h - amplitude) / 2,
      Math.max(1, w / bars - 3),
      amplitude,
    );
  }
  if (playing.value && !reducedMotion.matches)
    animation = requestAnimationFrame(draw);
}

function handleSelection(event: Event) {
  selectStudy((event as CustomEvent<StudyId>).detail);
}
function visibilityChange() {
  if (document.hidden && playing.value) stop();
}
onMounted(() => {
  window.addEventListener("select-study", handleSelection);
  document.addEventListener("visibilitychange", visibilityChange);
  observer = new ResizeObserver(() => {
    if (canvas.value) {
      canvas.value.width = Math.round(
        canvas.value.clientWidth * Math.min(window.devicePixelRatio, 2),
      );
      canvas.value.height = Math.round(
        canvas.value.clientHeight * Math.min(window.devicePixelRatio, 2),
      );
    }
    draw();
  });
  if (canvas.value) observer.observe(canvas.value);
});
onBeforeUnmount(() => {
  disposed = true;
  stop();
  cancelAnimationFrame(animation);
  observer?.disconnect();
  void context?.close();
  window.removeEventListener("select-study", handleSelection);
  document.removeEventListener("visibilitychange", visibilityChange);
});
</script>

<template>
  <div class="audio-console" :class="{ 'is-playing': playing }">
    <div class="console-track">
      <button
        class="play-button"
        type="button"
        :aria-label="
          playing ? 'Pause sound experiment' : 'Play sound experiment'
        "
        :aria-pressed="playing"
        @click="playing ? stop() : start()"
      >
        <svg
          v-if="!playing"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <path d="m8 4 13 8L8 20Z" fill="currentColor" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor" />
        </svg>
      </button>
      <div>
        <span class="micro console-status"
          ><i :class="{ live: playing }"></i
          >{{ playing ? "SIGNAL ACTIVE" : "READY TO EXPLORE" }}</span
        >
        <p class="console-title">
          {{ active.title }}<span> / SOUND STUDY {{ active.index }}</span>
        </p>
      </div>
    </div>
    <div class="console-scope">
      <canvas ref="canvas" aria-hidden="true"></canvas
      ><span class="micro"
        >{{ playing ? "LIVE SPECTRUM" : "SIGNAL PREVIEW"
        }}<span>{{ active.bpm }} BPM</span></span
      >
    </div>
    <div class="console-controls">
      <div class="study-switch" role="group" aria-label="Select sound study">
        <button
          v-for="study in soundStudies"
          :key="study.id"
          type="button"
          :aria-pressed="activeId === study.id"
          :class="{ selected: activeId === study.id }"
          :aria-label="`Select ${study.title}`"
          @click="selectStudy(study.id)"
        >
          {{ study.index }}
        </button>
      </div>
      <label class="volume-control"
        ><svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"
          /></svg
        ><span class="sr-only">Volume</span
        ><input
          v-model.number="volume"
          type="range"
          min="0"
          max="100"
          @input="changeVolume"
        /><span>{{ volume }}%</span></label
      >
    </div>
    <p v-if="error" class="audio-error" role="alert">{{ error }}</p>
    <span class="sr-only" aria-live="polite"
      >{{ active.title }} sound study.
      {{ playing ? "Playing." : "Paused." }}</span
    >
  </div>
</template>
