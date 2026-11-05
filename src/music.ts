import { audio } from './sound';

// Música chiptune original en bucle: melodía (cuadrada), bajo (triangular) y charles (ruido)
const BPM = 132;
const STEP = 60 / BPM / 2; // corcheas

const MELODY = [
  'A4 C5 E5 C5 A4 C5 E5 A5',
  'G5 E5 C5 E5 G5 -  E5 - ',
  'F5 E5 D5 C5 D5 E5 F5 D5',
  'E5 -  -  -  C5 -  B4 - ',
  'A4 C5 E5 C5 A4 C5 E5 A5',
  'B5 A5 G5 E5 G5 -  A5 - ',
  'F5 E5 D5 F5 E5 D5 C5 B4',
  'A4 -  E4 -  A4 -  -  - ',
]
  .join(' ')
  .split(/\s+/)
  .filter(Boolean);

// Fundamental de cada compás (Am C F E Am G F Am)
const BASS_ROOTS = ['A2', 'C3', 'F2', 'E2', 'A2', 'G2', 'F2', 'A2'];

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(note: string) {
  const n = NOTE_INDEX[note[0]] + (Number(note[note.length - 1]) + 1) * 12;
  return 440 * 2 ** ((n - 69) / 12);
}

let enabled = (() => {
  try {
    return localStorage.getItem('unochess.music') !== '0';
  } catch {
    return true;
  }
})();
let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

export const musicEnabled = () => enabled;

function note(c: AudioContext, f: number, t: number, dur: number, type: OscillatorType, gain: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = f;
  g.gain.setValueAtTime(gain, t);
  g.gain.setValueAtTime(gain, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t + dur * 0.95);
  osc.connect(g).connect(master!);
  osc.start(t);
  osc.stop(t + dur);
}

function hat(c: AudioContext, t: number) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = noise;
  g.gain.setValueAtTime(0.025, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  src.connect(g).connect(master!);
  src.start(t);
}

function schedule() {
  const c = audio();
  if (!c || !master) return;
  while (nextTime < c.currentTime + 0.25) {
    const i = step % MELODY.length;
    const m = MELODY[i];
    if (m !== '-') {
      // La nota dura hasta el siguiente símbolo que no sea '-'
      let len = 1;
      while (MELODY[(i + len) % MELODY.length] === '-' && len < 8) len++;
      note(c, freq(m), nextTime, STEP * len, 'square', 0.035);
    }
    const root = BASS_ROOTS[Math.floor(i / 8)];
    note(c, freq(root) * (i % 2 ? 2 : 1), nextTime, STEP, 'triangle', 0.09);
    if (i % 2 === 1) hat(c, nextTime);
    nextTime += STEP;
    step++;
  }
}

export function startMusic() {
  if (!enabled || timer) return;
  const c = audio();
  if (!c) return;
  master = c.createGain();
  master.gain.value = 0.8;
  master.connect(c.destination);
  nextTime = c.currentTime + 0.1;
  step = 0;
  timer = setInterval(schedule, 60);
  schedule();
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
  if (master) {
    const m = master;
    const c = audio();
    if (c) m.gain.setValueAtTime(0, c.currentTime);
    setTimeout(() => m.disconnect(), 300);
  }
  master = null;
}

export function setMusicEnabled(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem('unochess.music', v ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
  if (v) startMusic();
  else stopMusic();
}
