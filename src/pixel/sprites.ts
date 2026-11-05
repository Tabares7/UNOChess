/**
 * Iconos en pixel art definidos como cuadrículas de texto ('.' = transparente).
 * Las piezas y los avatares se dibujan por código en pieces.ts y avatars.ts.
 */
export type Grid = string[];
type Palette = Record<string, string>;

export { pieceUrl } from './pieces';
export { AVATARS, DEFAULT_AVATAR, avatarBg, avatarUrl } from './avatars';

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

const cache = new Map<string, string>();

export function iconUrl(name: IconName, color: string) {
  const key = name + color;
  let url = cache.get(key);
  if (!url) {
    url = gridToUrl(ICONS[name], { x: color });
    cache.set(key, url);
  }
  return url;
}
