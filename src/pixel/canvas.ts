/**
 * Lienzo de píxeles mínimo para dibujar sprites por código:
 * formas con sombreado automático (luz arriba a la izquierda), bordes y contorno.
 */
export type Test = (x: number, y: number) => boolean;

// ---------- Formas ----------
export const ellipse =
  (cx: number, cy: number, rx: number, ry: number): Test =>
  (x, y) =>
    ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;

/** Rectángulo con límites incluidos */
export const rect =
  (x0: number, y0: number, x1: number, y1: number): Test =>
  (x, y) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const and =
  (...tests: Test[]): Test =>
  (x, y) =>
    tests.every((t) => t(x, y));
export const or =
  (...tests: Test[]): Test =>
  (x, y) =>
    tests.some((t) => t(x, y));
export const not =
  (t: Test): Test =>
  (x, y) =>
    !t(x, y);

/** Triángulo relleno (punta arriba) entre la punta y la base */
export const triangle =
  (tipX: number, tipY: number, baseY: number, halfBase: number): Test =>
  (x, y) => {
    if (y < tipY || y > baseY) return false;
    const k = (y + 0.5 - tipY) / (baseY + 1 - tipY);
    return Math.abs(x + 0.5 - tipX) <= halfBase * k + 0.5;
  };

// ---------- Color ----------
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => '#' + v.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

export function mix(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
}

/** Rampa de color con sombras que tiran a morado, típico del pixel art */
export function ramp(base: string) {
  return {
    light: mix(base, '#fffbea', 0.42),
    base,
    shade: mix(base, '#3a1d5c', 0.32),
    deep: mix(base, '#22103a', 0.52),
    edge: mix(base, '#140a24', 0.66),
  };
}

export const OUTLINE = '#140c22';

export interface ShapeOptions {
  /** Sin sombreado */
  flat?: boolean;
  /** Dibuja el borde de la forma con su tono más oscuro */
  edge?: boolean;
  /** Centro y radios usados para la luz; por defecto la caja de la forma */
  light?: [number, number, number, number];
  /** Sesgo de la luz: positivo aclara, negativo oscurece */
  bias?: number;
}

export class Px {
  c: (string | null)[];

  constructor(
    public w: number,
    public h: number,
  ) {
    this.c = Array(w * h).fill(null);
  }

  get(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x];
  }

  set(x: number, y: number, col: string | null) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = col;
  }

  /** Pinta píxeles sueltos: lista de [x, y] */
  dots(points: [number, number][], col: string) {
    for (const [x, y] of points) this.set(x, y, col);
  }

  shape(test: Test, base: string, opts: ShapeOptions = {}) {
    const pts: [number, number][] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (test(x, y)) pts.push([x, y]);
    if (pts.length === 0) return;
    const r = ramp(base);
    let [cx, cy, rx, ry] = opts.light ?? [0, 0, 0, 0];
    if (!opts.light) {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs) + 1;
      const y0 = Math.min(...ys);
      const y1 = Math.max(...ys) + 1;
      [cx, cy, rx, ry] = [(x0 + x1) / 2, (y0 + y1) / 2, Math.max(1, (x1 - x0) / 2), Math.max(1, (y1 - y0) / 2)];
    }
    const bias = opts.bias ?? 0;
    for (const [x, y] of pts) {
      if (opts.flat) {
        this.set(x, y, base);
        continue;
      }
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const l = -0.62 * nx - 0.5 * ny + bias;
      this.set(x, y, l > 0.62 ? r.light : l > -0.2 ? r.base : l > -0.75 ? r.shade : r.deep);
    }
    if (opts.edge !== false) {
      const inside = new Set(pts.map(([x, y]) => y * this.w + x));
      for (const [x, y] of pts) {
        const n = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];
        if (n.some(([a, b]) => a >= 0 && b >= 0 && a < this.w && b < this.h && !inside.has(b * this.w + a))) {
          this.set(x, y, r.edge);
        }
      }
    }
  }

  /** Contorno exterior alrededor de todo lo dibujado; `ignore` se trata como vacío */
  outline(color = OUTLINE, ignore?: (c: string) => boolean) {
    const empty = (x: number, y: number) => {
      const v = this.get(x, y);
      return v === null || (ignore?.(v) ?? false);
    };
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!empty(x, y)) continue;
        if (!empty(x + 1, y) || !empty(x - 1, y) || !empty(x, y + 1) || !empty(x, y - 1)) {
          // No se contornea contra el borde del lienzo
          const inBounds = (a: number, b: number) => a >= 0 && b >= 0 && a < this.w && b < this.h;
          if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => inBounds(a, b) && !empty(a, b))) add.push([x, y]);
        }
      }
    }
    for (const [x, y] of add) this.set(x, y, color);
  }

  toUrl(): string {
    let rects = '';
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const col = this.get(x, y);
        let len = 1;
        while (x + len < this.w && this.get(x + len, y) === col) len++;
        if (col) {
          const [fill, opacity] = col.startsWith('rgba') ? rgbaParts(col) : [col, null];
          rects += `<rect x="${x}" y="${y}" width="${len}" height="1" fill="${fill}"${opacity ? ` fill-opacity="${opacity}"` : ''}/>`;
        }
        x += len;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" shape-rendering="crispEdges">${rects}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
}

function rgbaParts(c: string): [string, string] {
  const [r, g, b, a] = c.replace(/rgba\(|\)/g, '').split(',').map((s) => s.trim());
  return [toHex([Number(r), Number(g), Number(b)]), a];
}
