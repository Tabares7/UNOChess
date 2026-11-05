import type { Color, PieceType } from '../engine/types';
import { OUTLINE, Px } from './canvas';

/**
 * Piezas de 20x30 píxeles dibujadas como en un torno: cada fila es un
 * cilindro con su ancho, y el sombreado se calcula según la posición en la fila.
 */
export const PIECE_W = 20;
export const PIECE_H = 30;

type Material = 'body' | 'gold';

interface Row {
  /** Medio ancho de la fila (centrada) */
  hw?: number;
  /** Máscara explícita de 20 caracteres ('x' = relleno) */
  mask?: string;
  /** Aro: un tono más oscuro, para separar volúmenes */
  rim?: boolean;
  mat?: Material;
}

const LEVELS = ['light', 'hi', 'base', 'shade', 'deep'] as const;
type Level = (typeof LEVELS)[number];
type Ramp = Record<Level | 'ledge' | 'outline', string>;

const RAMPS: Record<Color | 'gold', Ramp> = {
  w: { light: '#ffffff', hi: '#f4ecd8', base: '#ddd0b3', shade: '#b09f80', deep: '#84755c', ledge: '#ffffff', outline: '#2a2035' },
  b: { light: '#8e88c0', hi: '#6a6497', base: '#4a4573', shade: '#322e52', deep: '#221f3a', ledge: '#a49ed6', outline: OUTLINE },
  gold: { light: '#fff4c2', hi: '#ffe066', base: '#fcc419', shade: '#e8890c', deep: '#b35c00', ledge: '#fffbe6', outline: OUTLINE },
};

const SHADOW = 'rgba(10, 6, 24, 0.38)';
const GEM = '#e03131';
const GEM_HI = '#ff8787';

const span = (r: Row): number[] => {
  if (r.mask) return [...r.mask].flatMap((ch, i) => (ch === 'x' ? [i] : []));
  const hw = r.hw ?? 0;
  return Array.from({ length: hw * 2 }, (_, i) => PIECE_W / 2 - hw + i);
};

/** Banda de luz según la posición horizontal (0 = izquierda, 1 = derecha) */
function band(t: number): number {
  if (t < 0.2) return 1;
  if (t < 0.4) return 0;
  if (t < 0.62) return 2;
  if (t < 0.84) return 3;
  return 4;
}

const body = (...hws: number[]): Row[] => hws.map((hw) => ({ hw }));
const rim = (...hws: number[]): Row[] => hws.map((hw) => ({ hw, rim: true }));
const gold = (...hws: number[]): Row[] => hws.map((hw) => ({ hw, mat: 'gold' as const }));

// Pie común: cuello, falda y peana
const BASE: Row[] = [...rim(6, 5), ...body(3, 3), ...body(4, 5, 6), ...rim(7), ...body(8), ...rim(8)];

const PROFILES: Record<Exclude<PieceType, 'N'>, Row[]> = {
  P: [...body(2, 3, 4, 4, 4, 4, 3), ...rim(5, 4), ...body(3, 3), ...body(4, 5, 6), ...rim(7), ...body(7), ...rim(7)],
  R: [
    { mask: '...xxx..xxxx..xxx...' },
    { mask: '...xxx..xxxx..xxx...' },
    ...rim(7, 7),
    ...body(6),
    ...body(5, 5, 5, 5, 5, 5, 5, 5, 5),
    ...rim(6),
    ...body(7, 7),
    ...rim(8),
    ...body(8),
    ...rim(8),
  ],
  B: [...gold(1), ...body(1, 2, 3, 4, 4, 5, 5, 5, 4, 4, 3), ...rim(5), ...body(3, 3), ...body(4, 5, 6), ...rim(7), ...body(8), ...rim(8)],
  Q: [
    ...gold(1),
    { mask: '...x...x.xx.x...x...', mat: 'gold' },
    { mask: '...xx..xxxxxx..xx...', mat: 'gold' },
    { mask: '...xxxxxxxxxxxxxx...', mat: 'gold' },
    { hw: 7, mat: 'gold', rim: true },
    ...body(6, 5, 5, 4, 4, 4, 4),
    ...BASE,
  ],
  K: [
    ...gold(1, 1),
    { mask: '.......xxxxxx.......', mat: 'gold' },
    ...gold(1, 1),
    ...body(3, 5, 6, 7),
    { hw: 7, mat: 'gold', rim: true },
    ...body(6, 5, 5, 4, 4, 4),
    ...BASE,
  ],
};

// Caballo: cabeza dibujada con máscara y el mismo pie que las demás piezas
const KNIGHT_HEAD = [
  '..........xx........',
  '.........xxxx.......',
  '........xxxxxx......',
  '.......xxxxxxxx.....',
  '......xxxxxxxxxx....',
  '.....xxxxxxxxxxx....',
  '....xxxxxxxxxxxxx...',
  '...xxxxxxxxxxxxxx...',
  '..xxxxxxxxxxxxxxx...',
  '..xxxxxxxxxxxxxxxx..',
  '..xxxxx..xxxxxxxxx..',
  '...xxx...xxxxxxxxx..',
  '.........xxxxxxxxx..',
  '........xxxxxxxxxx..',
  '........xxxxxxxxxx..',
  '.......xxxxxxxxxxx..',
];
const KNIGHT: Row[] = [...KNIGHT_HEAD.map((mask) => ({ mask })), ...rim(7), ...body(6, 7), ...rim(8), ...body(8), ...rim(8)];

function drawLathe(rows: Row[], color: Color): { px: Px; top: number } {
  const px = new Px(PIECE_W, PIECE_H);
  const bottom = PIECE_H - 2;
  const top = bottom - rows.length + 1;
  // Sombra en el suelo
  const lastHw = rows[rows.length - 1].hw ?? 8;
  for (let x = PIECE_W / 2 - lastHw - 1; x < PIECE_W / 2 + lastHw + 1; x++) px.set(x, PIECE_H - 1, SHADOW);
  for (let x = PIECE_W / 2 - lastHw; x < PIECE_W / 2 + lastHw; x++) px.set(x, PIECE_H - 2, SHADOW);

  rows.forEach((row, i) => {
    const y = top + i;
    const xs = span(row);
    const above = i > 0 ? new Set(span(rows[i - 1])) : new Set<number>();
    const L = Math.min(...xs);
    const R = Math.max(...xs);
    const ramp = RAMPS[row.mat === 'gold' ? 'gold' : color];
    for (const x of xs) {
      let lv = band((x - L) / Math.max(1, R - L));
      if (row.rim) lv = Math.min(4, Math.max(1, lv + 1));
      // Superficie superior que queda a la vista: borde iluminado
      const exposed = !above.has(x);
      px.set(x, y, exposed && lv < 4 ? ramp.ledge : ramp[LEVELS[lv]]);
    }
  });
  return { px, top };
}

function drawPiece(type: PieceType, color: Color): Px {
  const rows = type === 'N' ? KNIGHT : PROFILES[type];
  const { px, top } = drawLathe(rows, color);
  const ramp = RAMPS[color];
  const at = (x: number, row: number, col: string) => px.set(x, top + row, col);

  if (type === 'N') {
    // Crin a lo largo de la nuca
    for (let r = 1; r < 16; r++) {
      const xs = span({ mask: KNIGHT_HEAD[r] });
      const R = Math.max(...xs);
      at(R, r, ramp.deep);
      at(R - 1, r, r % 2 ? ramp.shade : ramp.deep);
    }
    at(8, 5, ramp.outline);
    at(8, 4, ramp.outline);
    at(7, 5, ramp.outline);
    at(9, 4, '#ffffff');
    at(3, 9, ramp.outline);
    at(4, 10, ramp.shade);
  }
  if (type === 'B') {
    // Ranura de la mitra
    [[11, 4], [11, 5], [10, 6], [10, 7]].forEach(([x, r]) => at(x, r, ramp.outline));
  }
  if (type === 'Q') {
    [6, 13].forEach((x) => at(x, 4, GEM));
    at(9, 4, GEM);
    at(10, 4, GEM);
    at(9, 4, GEM_HI);
  }
  if (type === 'K') {
    // Gema en la banda dorada (fila 9 del perfil)
    at(9, 9, GEM_HI);
    at(10, 9, GEM);
  }
  px.outline(ramp.outline, (c) => c === SHADOW);
  return px;
}

const cache = new Map<string, string>();

export function pieceUrl(type: PieceType, color: Color): string {
  const key = type + color;
  let url = cache.get(key);
  if (!url) {
    url = drawPiece(type, color).toUrl();
    cache.set(key, url);
  }
  return url;
}

/** Para pruebas */
export const drawPieceForTest = drawPiece;
