// Original procedural Web Audio track — no external asset needed.
// Driving sawtooth bassline + square-wave arpeggio lead over a four-chord
// loop, in the same fast-tempo electronic spirit as the game's pacing.
// `setRate()` speeds up tempo and pitch together, tracking the scroll ramp.

interface Chord {
  bassHz: number;
  arpeggioHz: [number, number, number, number];
}

// A minor -> F major -> C major -> G major, a generic/public-domain-style
// progression (not tied to any specific existing composition).
const CHORDS: Chord[] = [
  { bassHz: 110.0, arpeggioHz: [440.0, 523.25, 659.25, 880.0] }, // A minor
  { bassHz: 87.31, arpeggioHz: [349.23, 440.0, 523.25, 698.46] }, // F major
  { bassHz: 130.81, arpeggioHz: [523.25, 659.25, 783.99, 1046.5] }, // C major
  { bassHz: 98.0, arpeggioHz: [392.0, 493.88, 587.33, 783.99] }, // G major
];

const STEPS_PER_CHORD = 4; // 16th notes; one bar per chord
const BASE_STEP_SECONDS = 60 / 160 / 4; // 160 BPM, 16th-note grid

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let stepIndex = 0;
let rate = 1;
let running = false;
let nextStepTimer: ReturnType<typeof setTimeout> | null = null;

function ensureContext() {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.09;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function playVoice(
  freq: number,
  type: OscillatorType,
  duration: number,
  peakGain: number,
) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq * rate ** 0.25; // subtle pitch-up as rate climbs
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.85);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration);
}

function scheduleNextStep() {
  if (!running) return;

  const stepDuration = BASE_STEP_SECONDS / rate;
  const chordIndex = Math.floor(stepIndex / STEPS_PER_CHORD) % CHORDS.length;
  const stepInChord = stepIndex % STEPS_PER_CHORD;
  const chord = CHORDS[chordIndex];

  if (stepInChord === 0) {
    playVoice(chord.bassHz, "sawtooth", stepDuration * STEPS_PER_CHORD, 0.9);
  }
  playVoice(chord.arpeggioHz[stepInChord], "square", stepDuration, 0.5);

  stepIndex += 1;
  nextStepTimer = setTimeout(scheduleNextStep, stepDuration * 1000);
}

export function startMusic() {
  ensureContext();
  if (running) return;
  running = true;
  stepIndex = 0;
  scheduleNextStep();
}

export function stopMusic() {
  running = false;
  if (nextStepTimer) {
    clearTimeout(nextStepTimer);
    nextStepTimer = null;
  }
}

export function setMusicRate(multiplier: number) {
  rate = Math.max(0.5, multiplier);
}
