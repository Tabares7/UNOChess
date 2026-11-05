import { Px, and, ellipse, mix, not, or, ramp, rect, type Test } from './canvas';

/**
 * Retratos de 32x32 en estilo chibi. Cada personaje se compone por capas:
 * pelo trasero, cuerpo, cara, pelo delantero y accesorio.
 */
type Kind = 'crown' | 'knight' | 'wizard' | 'robot' | 'pirate' | 'ninja';
type Gender = 'm' | 'f';

interface AvatarDef {
  id: string;
  kind: Kind;
  gender: Gender;
  skin: string;
  hair: string;
  eyes: string;
  /** Color principal de la ropa o del accesorio */
  cloth: string;
  bg: 'red' | 'blue' | 'green' | 'yellow';
}

const def = (kind: Kind, gender: Gender, bg: AvatarDef['bg'], skin: string, hair: string, eyes: string, cloth: string): AvatarDef => ({
  id: `${kind}-${gender}`,
  kind,
  gender,
  skin,
  hair,
  eyes,
  cloth,
  bg,
});

export const AVATARS: AvatarDef[] = [
  def('crown', 'm', 'red', '#f5c9a0', '#7a4a2a', '#3b5bdb', '#c92a2a'),
  def('crown', 'f', 'yellow', '#8d5a3b', '#2b1a12', '#7048e8', '#7b2cbf'),
  def('knight', 'm', 'blue', '#c68642', '#2b1d0e', '#2f9e44', '#adb5bd'),
  def('knight', 'f', 'blue', '#ffe0c7', '#e8590c', '#1c7ed6', '#adb5bd'),
  def('wizard', 'm', 'green', '#f1c27d', '#e9ecef', '#5f3dc4', '#5f3dc4'),
  def('wizard', 'f', 'green', '#a86b4a', '#f783ac', '#2f9e44', '#c2255c'),
  def('robot', 'm', 'yellow', '#a9b8c9', '#868e96', '#3bc9db', '#868e96'),
  def('robot', 'f', 'yellow', '#c5d0dc', '#f783ac', '#3bc9db', '#9aa5b1'),
  def('pirate', 'm', 'red', '#d9a066', '#2b1d0e', '#1c7ed6', '#c92a2a'),
  def('pirate', 'f', 'red', '#ffd8b8', '#3a2418', '#2f9e44', '#c92a2a'),
  def('ninja', 'm', 'blue', '#e0ac69', '#1a1a2e', '#343a40', '#2b2f3a'),
  def('ninja', 'f', 'blue', '#ffe0c7', '#1a1a2e', '#c2255c', '#5f3dc4'),
];

export const DEFAULT_AVATAR = 'crown-m';

const S = 32;
const GOLD = '#fcc419';
const WHITE = '#f8f9fa';
const DARK = '#1a1626';

// Geometría compartida
const HEAD = ellipse(16, 15, 8.4, 8.3);
const BODY = ellipse(16, 33.5, 13.5, 8.8);
const NECK = rect(13, 21, 18, 26);
const MOUTH: [number, number][] = [
  [15, 20],
  [16, 20],
];

/** Fila inferior del flequillo para cada columna (x = 6..25); -1 = sin pelo */
const FRINGE: Record<Gender, number[]> = {
  f: [24, 22, 19, 15, 13, 12, 13, 12, 11, 12, 12, 11, 12, 13, 12, 13, 15, 19, 22, 24],
  m: [-1, 15, 16, 13, 12, 11, 12, 11, 10, 11, 11, 10, 11, 12, 11, 12, 13, 16, 15, -1],
};
const fringe = (g: Gender, x: number) => (x < 6 || x > 25 ? -1 : FRINGE[g][x - 6]);

const lighten = (c: string, t: number) => mix(c, '#ffffff', t);

function hairFront(p: Px, d: AvatarDef) {
  const cap = ellipse(16, 12.8, 9.6, 8.8);
  const sides: Test = (x, y) => (x <= 9 || x >= 22) && y >= 9;
  p.shape(and(or(cap, sides), (x, y) => y <= fringe(d.gender, x), (_x, y) => y >= 3), d.hair, { light: [15, 10, 10, 9] });
  // Brillo del pelo
  const shine = lighten(d.hair, 0.5);
  p.dots(
    [
      [11, 7],
      [12, 7],
      [13, 7],
      [10, 8],
      [11, 8],
    ],
    shine,
  );
}

function hairBackLong(p: Px, d: AvatarDef) {
  const wave: Test = (x, y) => y <= 27 + (x % 2);
  p.shape(and(or(ellipse(16, 14, 10.6, 10.4), rect(6, 14, 25, 28)), wave), d.hair, { light: [16, 14, 11, 14], bias: -0.3 });
}

/** Mechones largos que caen por delante de los hombros */
function hairStrands(p: Px, d: AvatarDef) {
  const wave: Test = (x, y) => y <= 27 + ((x + 1) % 2);
  p.shape(and(or(rect(6, 15, 8, 28), rect(23, 15, 25, 28)), wave), d.hair, { light: [16, 20, 10, 9] });
}

function head(p: Px, d: AvatarDef) {
  p.shape(NECK, mix(d.skin, '#5a2d4a', 0.25), { flat: true, edge: false });
  p.shape(ellipse(7.8, 16, 1.6, 2.3), d.skin);
  p.shape(ellipse(24.2, 16, 1.6, 2.3), d.skin, { bias: -0.4 });
  p.shape(HEAD, d.skin, { light: [15, 13, 9, 10], bias: 0.25 });
}

function face(p: Px, d: AvatarDef, opts: { brows?: string; blush?: boolean; mouth?: boolean } = {}) {
  const lash = DARK;
  const iris = d.eyes;
  const irisDark = mix(d.eyes, '#140a24', 0.45);
  // Ojos: pestaña arriba, brillo blanco e iris
  p.dots(
    [
      [12, 15],
      [13, 15],
      [18, 15],
      [19, 15],
    ],
    lash,
  );
  p.dots(
    [
      [12, 16],
      [18, 16],
    ],
    '#ffffff',
  );
  p.dots(
    [
      [13, 16],
      [19, 16],
      [12, 17],
      [18, 17],
    ],
    iris,
  );
  p.dots(
    [
      [13, 17],
      [19, 17],
    ],
    irisDark,
  );
  if (d.gender === 'f') {
    p.dots(
      [
        [11, 15],
        [10, 14],
        [20, 15],
        [21, 14],
      ],
      lash,
    );
  }
  const brow = opts.brows ?? mix(d.hair, DARK, 0.3);
  p.dots(
    d.gender === 'm'
      ? [
          [11, 13],
          [12, 13],
          [13, 13],
          [18, 13],
          [19, 13],
          [20, 13],
        ]
      : [
          [12, 13],
          [13, 13],
          [18, 13],
          [19, 13],
        ],
    brow,
  );
  if (opts.blush !== false) {
    const blush = mix(d.skin, '#ff4d79', 0.4);
    p.dots(
      [
        [10, 18],
        [11, 18],
        [20, 18],
        [21, 18],
      ],
      blush,
    );
  }
  p.set(16, 18, ramp(d.skin).shade);
  if (opts.mouth !== false) p.dots(MOUTH, d.gender === 'f' ? '#d6336c' : '#9c3d3d');
}

function clothes(p: Px, color: string, skin: string) {
  p.shape(BODY, color, { light: [14, 27, 12, 6] });
  // Escote en V
  p.shape(
    (x, y) => y >= 25 && y <= 27 && Math.abs(x + 0.5 - 16) <= 28 - y,
    mix(skin, '#5a2d4a', 0.25),
    { flat: true, edge: false },
  );
}

// ---------- Accesorios ----------
function crown(p: Px, small: boolean) {
  if (small) {
    p.shape(rect(11, 5, 20, 6), GOLD);
    p.shape(or(rect(15, 1, 16, 4), rect(12, 3, 13, 4), rect(18, 3, 19, 4)), GOLD);
    p.dots([[15, 5], [16, 5]], '#f06595');
    p.set(15, 2, '#fff4c2');
    return;
  }
  p.shape(rect(9, 4, 22, 7), GOLD, { light: [12, 4, 8, 4] });
  p.shape(or(rect(9, 1, 10, 3), rect(13, 0, 14, 3), rect(17, 0, 18, 3), rect(21, 1, 22, 3)), GOLD);
  p.dots([[15, 5], [16, 5]], '#e03131');
  p.dots([[11, 5], [20, 5]], '#4dabf7');
  p.dots([[13, 0], [17, 0]], '#fff4c2');
}

function knightHelmet(p: Px) {
  const steel = '#ced4da';
  p.shape(and(ellipse(16, 12.5, 9.8, 9.3), rect(0, 0, 31, 13)), steel, { light: [13, 8, 10, 7] });
  p.shape(or(rect(7, 13, 9, 21), rect(22, 13, 24, 21)), steel, { light: [16, 16, 9, 6] });
  p.shape(rect(15, 13, 16, 17), steel);
  p.shape(rect(7, 11, 24, 12), '#868e96', { light: [12, 11, 10, 2] });
  p.dots([[9, 11], [16, 11], [22, 11]], '#f1f3f5');
  // Penacho
  p.shape(or(ellipse(20, 2.5, 4.5, 2.4), ellipse(24.5, 5, 3, 3.2)), '#e03131', { light: [20, 2, 6, 4] });
}

function armor(p: Px) {
  p.shape(BODY, '#adb5bd', { light: [12, 27, 12, 6] });
  p.shape(or(ellipse(6, 28, 5, 4), ellipse(26, 28, 5, 4)), '#ced4da', { light: [12, 26, 14, 4] });
  p.shape(rect(15, 26, 16, 31), '#868e96', { flat: true, edge: false });
  p.dots([[12, 28], [19, 28]], '#f1f3f5');
}

function wizardHat(p: Px, color: string) {
  const cone: Test = (x, y) => {
    if (y < 0 || y > 9) return false;
    const cx = 21 - y * 0.55;
    const half = 1 + y * 0.85;
    return Math.abs(x + 0.5 - cx) <= half;
  };
  p.shape(cone, color, { light: [15, 4, 6, 6] });
  p.shape(and(cone, rect(0, 7, 31, 8)), GOLD, { light: [14, 7, 7, 2] });
  p.shape(ellipse(16, 10, 13.2, 2.6), color, { light: [13, 9, 13, 3] });
  // Estrella
  p.dots([[16, 3], [15, 4], [16, 4], [17, 4], [16, 5]], '#fff4c2');
}

function beard(p: Px, color: string, big: boolean) {
  const area = big ? ellipse(16, 22, 8.4, 7.6) : ellipse(16, 19.6, 7.4, 4.8);
  const notMouth: Test = (x, y) => !(y === 20 && (x === 15 || x === 16));
  p.shape(and(area, rect(0, big ? 19 : 20, 31, 31), notMouth), color, { light: [14, big ? 22 : 20, 8, 6] });
  // Bigote
  p.shape(or(rect(13, 19, 15, 19), rect(16, 19, 18, 19)), color, { edge: false, bias: 0.3 });
}

function robotParts(p: Px, d: AvatarDef) {
  const grey = '#868e96';
  p.shape(or(rect(6, 14, 8, 18), rect(23, 14, 25, 18)), grey);
  p.shape(rect(15, 2, 16, 6), grey, { edge: false });
  p.shape(ellipse(16, 2, 2.2, 2.2), '#e03131');
  p.set(15, 1, '#ffa8a8');
  // Visor con ojos luminosos
  p.shape(rect(9, 14, 22, 18), '#1b1b2f', { flat: true });
  p.dots([[11, 16], [12, 16], [13, 16], [18, 16], [19, 16], [20, 16]], '#66d9e8');
  p.dots([[11, 17], [12, 17], [13, 17], [18, 17], [19, 17], [20, 17]], '#1098ad');
  // Rejilla de la boca
  p.dots([[13, 20], [15, 20], [17, 20]], '#495057');
  p.dots([[14, 20], [16, 20], [18, 20]], '#343a40');
  if (d.gender === 'f') {
    p.shape(and(ellipse(16, 12, 9.4, 8.6), rect(0, 3, 31, 11)), d.hair, { light: [13, 7, 9, 5] });
    p.shape(or(ellipse(7.5, 8, 3.2, 3.2), ellipse(24.5, 8, 3.2, 3.2)), d.hair, { light: [12, 6, 14, 4] });
    p.dots([[10, 14], [21, 14]], '#f783ac');
  }
}

function robotBody(p: Px, color: string) {
  p.shape(BODY, color, { light: [13, 27, 12, 6] });
  p.shape(rect(11, 26, 20, 31), mix(color, '#ffffff', 0.25), { light: [14, 27, 6, 4] });
  p.dots([[15, 28], [16, 28]], '#66d9e8');
  p.dots([[15, 29], [16, 29]], '#1098ad');
}

function pirateHat(p: Px) {
  const hat = or(and(ellipse(16, 8, 13.8, 4.4), rect(0, 0, 31, 10)), ellipse(16, 5.5, 7.6, 4.8));
  p.shape(hat, '#343a40', { light: [13, 5, 12, 5] });
  p.shape(and(ellipse(16, 8, 13.8, 4.4), rect(0, 10, 31, 10)), GOLD, { flat: true, edge: false });
  // Calavera
  p.dots([[15, 4], [16, 4], [15, 5], [16, 5]], WHITE);
  p.dots([[14, 6], [17, 6]], WHITE);
}

function eyepatch(p: Px) {
  p.shape(rect(17, 15, 20, 18), DARK, { flat: true, edge: false });
  p.dots(
    [
      [8, 13],
      [9, 13],
      [10, 13],
      [11, 14],
      [12, 14],
      [13, 14],
      [14, 14],
      [15, 15],
      [16, 15],
    ],
    DARK,
  );
}

function vest(p: Px, color: string) {
  p.shape(BODY, WHITE, { light: [14, 27, 10, 6] });
  p.shape(and(BODY, or(rect(0, 0, 12, 31), rect(19, 0, 31, 31))), color, { light: [10, 27, 12, 6] });
  p.dots([[14, 28], [17, 28], [15, 30], [16, 30]], '#adb5bd');
}

function bandana(p: Px) {
  p.shape(and(ellipse(16, 12.6, 9.9, 8.9), rect(0, 3, 31, 12)), '#e03131', { light: [13, 8, 10, 6] });
  p.shape(or(ellipse(26, 12, 2.6, 1.8), ellipse(27, 15.5, 2, 2.6)), '#c92a2a');
  p.dots([[12, 7], [17, 6], [20, 9], [10, 10], [15, 10]], WHITE);
}

function ninjaWrap(p: Px, d: AvatarDef) {
  const wrap = ellipse(16, 15, 9.4, 9.4);
  p.shape(and(wrap, not(rect(9, 14, 22, 17))), d.cloth, { light: [14, 13, 10, 10] });
  const band = d.gender === 'f' ? '#f06595' : '#e03131';
  p.shape(and(wrap, rect(0, 10, 31, 12)), band, { light: [12, 11, 10, 2] });
  p.shape(rect(13, 10, 18, 12), '#ced4da', { light: [14, 10, 4, 2] });
  p.dots([[15, 11], [16, 11]], '#868e96');
  p.shape(or(ellipse(26.5, 12, 3, 1.5), ellipse(28, 15.5, 1.6, 3)), band);
}

// ---------- Composición ----------
function drawAvatar(d: AvatarDef): Px {
  const p = new Px(S, S);
  const long = d.gender === 'f' && d.kind !== 'robot' && d.kind !== 'ninja';

  if (long) hairBackLong(p, d);
  if (d.kind === 'ninja' && d.gender === 'f') {
    // Coleta alta
    p.shape(or(ellipse(23, 4.5, 3.4, 4), ellipse(26, 9, 2.6, 4.5)), d.hair, { light: [22, 4, 5, 6] });
  }

  // Cuerpo
  if (d.kind === 'knight') armor(p);
  else if (d.kind === 'robot') robotBody(p, d.cloth);
  else if (d.kind === 'pirate') vest(p, d.cloth);
  else {
    clothes(p, d.cloth, d.skin);
    if (d.kind === 'crown' && d.gender === 'm') {
      // Cuello de armiño
      p.shape(and(ellipse(16, 28, 11, 3.4), rect(0, 25, 31, 31)), WHITE, { light: [12, 27, 10, 3] });
      p.dots([[10, 28], [15, 29], [20, 28]], DARK);
    }
    if (d.kind === 'crown' && d.gender === 'f') p.dots([[12, 27], [14, 28], [16, 28], [18, 27]], GOLD);
    if (d.kind === 'wizard') p.dots([[9, 29], [22, 28], [12, 31]], '#fff4c2');
  }
  if (long) hairStrands(p, d);

  head(p, d);
  const robot = d.kind === 'robot';
  if (!robot) face(p, d, { brows: d.kind === 'wizard' && d.gender === 'm' ? WHITE : undefined });

  switch (d.kind) {
    case 'crown':
      hairFront(p, d);
      if (d.gender === 'm') beard(p, d.hair, false);
      crown(p, d.gender === 'f');
      break;
    case 'knight':
      if (d.gender === 'f') hairFront(p, d);
      knightHelmet(p);
      break;
    case 'wizard':
      hairFront(p, d);
      if (d.gender === 'm') beard(p, d.hair, true);
      wizardHat(p, d.cloth);
      break;
    case 'robot':
      robotParts(p, d);
      break;
    case 'pirate':
      if (d.gender === 'm') {
        hairFront(p, d);
        beard(p, d.hair, false);
        pirateHat(p);
        eyepatch(p);
      } else {
        hairFront(p, d);
        bandana(p);
        p.dots([[7, 19], [7, 20], [8, 21]], GOLD);
      }
      break;
    case 'ninja':
      ninjaWrap(p, d);
      break;
  }

  p.outline();
  return p;
}

const cache = new Map<string, string>();

export function avatarUrl(id: string): string {
  const d = AVATARS.find((a) => a.id === id) ?? AVATARS[0];
  let url = cache.get(d.id);
  if (!url) {
    url = drawAvatar(d).toUrl();
    cache.set(d.id, url);
  }
  return url;
}

export const avatarBg = (id: string) => (AVATARS.find((a) => a.id === id) ?? AVATARS[0]).bg;
