import type { Color, PieceType } from '../engine/types';

/**
 * Sprites en pixel art definidos como cuadrículas de texto.
 * Cada carácter es un píxel; '.' es transparente y el resto se busca en una paleta.
 */
export type Grid = string[];
type Palette = Record<string, string>;

// ---------- Piezas (16x16) ----------
// o = contorno, f = relleno, h = brillo, s = sombra
export const PIECES: Record<PieceType, Grid> = {
  P: [
    '................',
    '................',
    '................',
    '......oooo......',
    '.....ohfffo.....',
    '.....offffo.....',
    '.....offfso.....',
    '......osso......',
    '.....oooooo.....',
    '......offo......',
    '......offo......',
    '.....offfso.....',
    '....offfffso....',
    '...oooooooooo...',
    '...ohffffffso...',
    '...oooooooooo...',
  ],
  R: [
    '................',
    '..ooo.oooo.ooo..',
    '..ohfoohffoffo..',
    '..ohffffffffso..',
    '..oooooooooooo..',
    '...ohffffffso...',
    '...ohffffffso...',
    '...ohffffffso...',
    '...ohffffffso...',
    '...ohffffffso...',
    '...ohffffffso...',
    '..oooooooooooo..',
    '..ohffffffffso..',
    '.oooooooooooooo.',
    '.ohffffffffffso.',
    '.oooooooooooooo.',
  ],
  N: [
    '................',
    '.......oo.......',
    '......ohfo......',
    '.....ohfffoo....',
    '....ohffoffso...',
    '...ohffffffso...',
    '..ohfffffffso...',
    '..offsoofffso...',
    '...oo.ohfffso...',
    '.....ohffffso...',
    '....ohfffffso...',
    '....ohfffffso...',
    '...oooooooooo...',
    '...ohffffffso...',
    '..oooooooooooo..',
    '................',
  ],
  B: [
    '................',
    '.......oo.......',
    '......ohfo......',
    '.......oo.......',
    '......ohfo......',
    '.....ohfofo.....',
    '....ohffoffo....',
    '....ohfoffso....',
    '....ohffffso....',
    '.....ohffso.....',
    '......oooo......',
    '.....ohffso.....',
    '....oooooooo....',
    '...ohffffffso...',
    '...oooooooooo...',
    '................',
  ],
  Q: [
    '................',
    '..o....oo....o..',
    '.ofo..ohfo..ofo.',
    '..o...ohfo...o..',
    '..oo..offo..oo..',
    '..ofooffffooso..',
    '..ohffffffffso..',
    '...ohffffffso...',
    '....ohffffso....',
    '....oooooooo....',
    '.....ohffso.....',
    '....ohffffso....',
    '...ohffffffso...',
    '..oooooooooooo..',
    '..ohffffffffso..',
    '..oooooooooooo..',
  ],
  K: [
    '.......oo.......',
    '......ohfo......',
    '.....oohfoo.....',
    '.....ohfffo.....',
    '.....oohfoo.....',
    '......ohfo......',
    '...oooohfoooo...',
    '..ohffffffffso..',
    '..ohffffffffso..',
    '...ohffffffso...',
    '....ohffffso....',
    '....oooooooo....',
    '...ohffffffso...',
    '..oooooooooooo..',
    '..ohffffffffso..',
    '..oooooooooooo..',
  ],
};

const PIECE_PALETTES: Record<Color, Palette> = {
  w: { o: '#1a1626', f: '#f5efe0', h: '#ffffff', s: '#c4b9a3' },
  b: { o: '#0b0a12', f: '#3d3a55', h: '#77739c', s: '#24223a' },
};

// ---------- Iconos (9x9, un solo color) ----------
export const ICONS = {
  skip: ['..xxxxx..', '.xx...xx.', 'xx...xxxx', 'x...xx..x', 'x..xx...x', 'x.xx....x', 'xxxx...xx', '.xx...xx.', '..xxxxx..'],
  reverse: ['..x......', '.xxx.....', 'xxxxx....', '..x...x..', '..x...x..', '..x...x..', '....xxxxx', '.....xxx.', '......x..'],
  wild: ['....x....', '....x....', '...xxx...', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '..xx.xx..', '.xx...xx.', '.x.....x.'],
  shield: ['xxxxxxxxx', 'xxxx.xxxx', 'xxxx.xxxx', 'x.......x', 'xxxx.xxxx', '.xxx.xxx.', '.xxx.xxx.', '..xx.xx..', '....x....'],
  teleport: ['..xxxxx..', '.x.....x.', 'x..xxx..x', 'x.x...x.x', 'x.x.x.x.x', 'x.x..xx.x', 'x..x....x', '.x..xxxx.', '..x......'],
  freeze: ['....x....', '.x..x..x.', '..x.x.x..', '...xxx...', 'xxxxxxxxx', '...xxx...', '..x.x.x..', '.x..x..x.', '....x....'],
  flag: ['xxxxxxx..', 'x.xxxxxx.', 'x..xxxxxx', 'x.xxxxxx.', 'xxxxxxx..', 'x........', 'x........', 'x........', 'x........'],
  help: ['..xxxxx..', '.xx...xx.', '.xx...xx.', '.....xx..', '....xx...', '....xx...', '.........', '....xx...', '....xx...'],
  sound: ['....x....', '...xx..x.', 'xxxxx...x', 'xxxxx.x.x', 'xxxxx.x.x', 'xxxxx.x.x', 'xxxxx...x', '...xx..x.', '....x....'],
  mute: ['....x....', '...xx....', 'xxxxx....', 'xxxxx.x.x', 'xxxxx..x.', 'xxxxx.x.x', 'xxxxx....', '...xx....', '....x....'],
  music: ['...xxxxxx', '...xxxxxx', '...x....x', '...x....x', '...x....x', '.xxx..xxx', 'xxxx.xxxx', 'xxxx.xxxx', '.xx...xx.'],
  musicOff: ['x..xxxxxx', '.x.xxxxxx', '..xx....x', '...x....x', '...xx...x', '.xxx.xxxx', 'xxxx.xxxx', 'xxxx.xxxx', '.xx...xx.'],
  globe: ['..xxxxx..', '.x..x..x.', 'x..x.x..x', 'xxxxxxxxx', 'x..x.x..x', 'xxxxxxxxx', 'x..x.x..x', '.x..x..x.', '..xxxxx..'],
  phone: ['.xxxxxxx.', '.x.....x.', '.x.....x.', '.x.....x.', '.x.....x.', '.x.....x.', '.xxxxxxx.', '.xxx.xxx.', '.xxxxxxx.'],
  link: ['.........', '.xxx.....', 'x...x....', 'x..xxxxx.', 'x...x...x', '.xxxxx..x', '....x...x', '.....xxx.', '.........'],
} satisfies Record<string, Grid>;

export type IconName = keyof typeof ICONS;

// ---------- Avatares (16x16) ----------
// Capas que se superponen: cara base, pelo y accesorio.
const FACE: Grid = [
  '................',
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....okkkkkko....',
  '...okkkkkkkko...',
  '...okkekkekko...',
  '...okkekkekko...',
  '...okkkkkkkko...',
  '...oKkkmmkkKo...',
  '....oKkkkkKo....',
  '.....oooooo.....',
  '....occcccco....',
  '...occcccccco...',
  '..occcccccccco..',
];

const HAIR: Record<'m' | 'f', Grid> = {
  m: [
    '................',
    '................',
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '...hh......hh...',
    '...h........h...',
  ],
  f: [
    '................',
    '................',
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhh....hhhh..',
    '..hh........hh..',
    '..hh........hh..',
    '..hh........hh..',
    '..hh...ll...hh..',
    '..hhh......hhh..',
    '..hhh......hhh..',
    '..hh........hh..',
  ],
};

type AvatarKind = 'crown' | 'knight' | 'wizard' | 'robot' | 'pirate' | 'ninja';

const ACCESSORY: Record<AvatarKind, { all: Grid; m?: Grid; f?: Grid }> = {
  crown: {
    all: ['................', '....y..yy..y....', '....yy.yy.yy....', '....yyyyyyyy....', '....yRYyyYRy....'],
  },
  knight: {
    all: [
      '........RR......',
      '.......RRR......',
      '.....gggggg.....',
      '....gggggggg....',
      '...gggggggggg...',
      '...gGGGGGGGGg...',
      '...g........g...',
      '...g........g...',
      '...g........g...',
      '...g........g...',
    ],
  },
  wizard: {
    all: ['........pp......', '.......ppp......', '......pppp......', '.....ppypp......', '...pppppppppp...', '..pppppppppppp..'],
    m: [
      '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................',
      '....ww....ww....', '....wwwwwwww....', '.....wwwwww.....', '......wwww......',
    ],
  },
  robot: {
    all: [
      '.......RR.......', '........g.......', '........g.......', '................', '................',
      '................', '................', '......C..C......', '......C..C......',
    ],
  },
  pirate: {
    all: [
      '................', '................', '................', '.....RRRRRR.....', '....RRwRRwRR....',
      '...RRRRRRRRRR...', '................', '.........oo.....', '.........oo.....',
    ],
  },
  ninja: {
    all: [
      '................', '................', '................', '.....nnnnnn.....', '....nnnnnnnn....',
      '...nnnnnnnnnn...', '...RRRRRRRRRR...', '...n........n...', '...n........n...',
      '...nnnnnnnnnn...', '...nnnnnnnnnn...', '....nnnnnnnn....',
    ],
  },
};

interface AvatarDef {
  id: string;
  kind: AvatarKind;
  gender: 'm' | 'f';
  skin: [string, string];
  hair: string;
  shirt: string;
  bg: 'red' | 'blue' | 'green' | 'yellow';
}

const SKINS: [string, string][] = [
  ['#f2c29b', '#d99a74'],
  ['#c68642', '#a0672f'],
  ['#ffdbac', '#e8b98a'],
  ['#8d5524', '#6b3e17'],
  ['#e0ac69', '#c18c4c'],
  ['#f1c27d', '#d4a25c'],
];

export const AVATARS: AvatarDef[] = (
  [
    ['crown', 'red', '#6b3e1f', '#c92a2a', '#f5c542', '#7b2cbf'],
    ['knight', 'blue', '#3d2c1e', '#1971c2', '#e8590c', '#1971c2'],
    ['wizard', 'green', '#adb5bd', '#5f3dc4', '#e64980', '#5f3dc4'],
    ['robot', 'yellow', '#5d6d7e', '#495057', '#ff6fb5', '#495057'],
    ['pirate', 'red', '#2b1d0e', '#f8f9fa', '#9c3d10', '#e03131'],
    ['ninja', 'blue', '#111111', '#212529', '#b197fc', '#343a40'],
  ] as [AvatarKind, AvatarDef['bg'], string, string, string, string][]
).flatMap(([kind, bg, hairM, shirtM, hairF, shirtF], i) => [
  { id: `${kind}-m`, kind, gender: 'm' as const, skin: SKINS[i], hair: hairM, shirt: shirtM, bg },
  { id: `${kind}-f`, kind, gender: 'f' as const, skin: SKINS[(i + 3) % SKINS.length], hair: hairF, shirt: shirtF, bg },
]);

export const DEFAULT_AVATAR = 'crown-m';

function overlay(base: Grid, top: Grid): Grid {
  return base.map((row, y) => {
    const t = top[y];
    if (!t) return row;
    let out = '';
    for (let x = 0; x < row.length; x++) out += t[x] && t[x] !== '.' ? t[x] : row[x];
    return out;
  });
}

function avatarGrid(def: AvatarDef): Grid {
  let g = FACE;
  // El ninja hombre lleva todo tapado; el robot hombre no tiene pelo
  if (!(def.gender === 'm' && (def.kind === 'ninja' || def.kind === 'robot'))) g = overlay(g, HAIR[def.gender]);
  const acc = ACCESSORY[def.kind];
  g = overlay(g, acc.all);
  const extra = acc[def.gender];
  if (extra) g = overlay(g, extra);
  return g;
}

function avatarPalette(def: AvatarDef): Palette {
  const robot = def.kind === 'robot';
  return {
    o: '#1a1626',
    k: robot ? '#b8c4d0' : def.skin[0],
    K: robot ? '#8796a5' : def.skin[1],
    e: '#1a1626',
    m: robot ? '#495057' : '#a0522d',
    l: '#d6336c',
    h: def.hair,
    c: def.shirt,
    y: '#ffd43b',
    Y: '#f08c00',
    R: '#e03131',
    g: '#adb5bd',
    G: '#495057',
    p: '#7048e8',
    w: '#f8f9fa',
    n: def.gender === 'f' ? '#5f3dc4' : '#212529',
    C: '#3bc9db',
  };
}

// ---------- Conversión a imagen ----------
const cache = new Map<string, string>();

/** Convierte una cuadrícula en un SVG (data URL) uniendo píxeles iguales consecutivos. */
export function gridToUrl(grid: Grid, palette: Palette): string {
  const w = grid[0].length;
  const h = grid.length;
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let len = 1;
      while (row[x + len] === ch) len++;
      const fill = palette[ch];
      if (ch !== '.' && fill) rects += `<rect x="${x}" y="${y}" width="${len}" height="1" fill="${fill}"/>`;
      x += len;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function cached(key: string, make: () => string) {
  let v = cache.get(key);
  if (!v) {
    v = make();
    cache.set(key, v);
  }
  return v;
}

export const pieceUrl = (type: PieceType, color: Color) =>
  cached(`p${type}${color}`, () => gridToUrl(PIECES[type], PIECE_PALETTES[color]));

export const iconUrl = (name: IconName, color: string) =>
  cached(`i${name}${color}`, () => gridToUrl(ICONS[name], { x: color }));

export function avatarUrl(id: string) {
  const def = AVATARS.find((a) => a.id === id) ?? AVATARS[0];
  return cached(`a${def.id}`, () => gridToUrl(avatarGrid(def), avatarPalette(def)));
}

export const avatarBg = (id: string) => (AVATARS.find((a) => a.id === id) ?? AVATARS[0]).bg;

/** Para las pruebas: todas las cuadrículas deben ser rectangulares */
export function allGrids(): [string, Grid][] {
  return [
    ...Object.entries(PIECES),
    ...Object.entries(ICONS),
    ...AVATARS.map((a) => [a.id, avatarGrid(a)] as [string, Grid]),
  ];
}
