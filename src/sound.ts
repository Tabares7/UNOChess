// Sonidos sintetizados con Web Audio: no hace falta descargar archivos
let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('unochess.muted') === '1';
} catch {
  /* sin almacenamiento */
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('unochess.muted', m ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS = {
  move: () => tone(420, 0, 0.08, 'triangle', 0.25),
  capture: () => {
    tone(220, 0, 0.12, 'square', 0.12);
    tone(160, 0.05, 0.15, 'square', 0.1);
  },
  card: () => {
    tone(900, 0, 0.05, 'triangle', 0.12);
    tone(1300, 0.04, 0.06, 'triangle', 0.1);
  },
  check: () => {
    tone(660, 0, 0.12, 'sawtooth', 0.1);
    tone(880, 0.12, 0.18, 'sawtooth', 0.1);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.18)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, 'sine', 0.18)),
  error: () => tone(140, 0, 0.15, 'square', 0.08),
  pop: () => tone(700, 0, 0.06, 'sine', 0.15),
};

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName) {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    SOUNDS[name]();
  } catch {
    /* audio no disponible */
  }
}
