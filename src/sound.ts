// Sonidos 8-bit sintetizados con Web Audio: no hace falta descargar archivos
let ctx: AudioContext | null = null;

function loadFlag(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function saveFlag(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
}

let muted = loadFlag('unochess.muted');

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  saveFlag('unochess.muted', m);
}

export function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Nota de onda cuadrada con barrido opcional de frecuencia */
export function blip(
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; slideTo?: number; dest?: AudioNode } = {},
) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'square';
  const t = c.currentTime + start;
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
  const gain = opts.gain ?? 0.08;
  g.gain.setValueAtTime(gain, t);
  // Corte seco al final, como en las consolas antiguas
  g.gain.setValueAtTime(gain, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(opts.dest ?? c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

const arp = (notes: number[], step: number, opts?: Parameters<typeof blip>[3]) =>
  notes.forEach((f, i) => blip(f, i * step, step, opts));

const SOUNDS = {
  move: () => blip(330, 0, 0.06, { slideTo: 220, gain: 0.1 }),
  capture: () => {
    blip(600, 0, 0.12, { slideTo: 90, gain: 0.1 });
    blip(120, 0.02, 0.14, { type: 'sawtooth', slideTo: 60, gain: 0.06 });
  },
  card: () => arp([880, 1320], 0.045),
  check: () => arp([660, 880, 660, 880], 0.07, { gain: 0.07 }),
  win: () => arp([523, 659, 784, 1046, 784, 1046, 1318], 0.09),
  lose: () => arp([392, 370, 349, 330, 262], 0.14, { type: 'triangle', gain: 0.15 }),
  error: () => blip(110, 0, 0.15, { gain: 0.07 }),
  pop: () => blip(520, 0, 0.05, { slideTo: 780, gain: 0.07 }),
  turn: () => arp([523, 784], 0.07, { gain: 0.06 }),
};

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName) {
  if (muted) return;
  SOUNDS[name]();
}
