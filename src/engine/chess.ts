import type { Board, Color, Move, Piece, PieceType } from './types';

export const fileOf = (sq: number) => sq % 8;
export const rankOf = (sq: number) => Math.floor(sq / 8);
export const sq = (file: number, rank: number) => rank * 8 + file;
export const onBoard = (file: number, rank: number) => file >= 0 && file < 8 && rank >= 0 && rank < 8;
export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
export const squareName = (s: number) => 'abcdefgh'[fileOf(s)] + (rankOf(s) + 1);

/** Distancia de Chebyshev: el caballo cuenta como 2, el enroque como 2. */
export const distance = (a: number, b: number) =>
  Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));

const BACK: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

export function initialBoard(): Board {
  const board: Board = Array(64).fill(null);
  const put = (type: PieceType, color: Color, s: number, id: string) => {
    board[s] = { id, type, color, origin: s, originType: type, moved: false };
  };
  for (let f = 0; f < 8; f++) {
    put(BACK[f], 'w', sq(f, 0), `w${BACK[f]}${f}`);
    put('P', 'w', sq(f, 1), `wP${f}`);
    put('P', 'b', sq(f, 6), `bP${f}`);
    put(BACK[f], 'b', sq(f, 7), `b${BACK[f]}${f}`);
  }
  return board;
}

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export const pawnDir = (c: Color) => (c === 'w' ? 1 : -1);
export const lastRank = (c: Color) => (c === 'w' ? 7 : 0);

/** ¿Alguna pieza de `by` ataca la casilla `target`? */
export function isAttacked(board: Board, target: number, by: Color): boolean {
  const tf = fileOf(target);
  const tr = rankOf(target);
  // Peones
  const pr = tr - pawnDir(by);
  for (const df of [-1, 1]) {
    if (onBoard(tf + df, pr)) {
      const p = board[sq(tf + df, pr)];
      if (p && p.color === by && p.type === 'P') return true;
    }
  }
  for (const [df, dr] of KNIGHT) {
    if (!onBoard(tf + df, tr + dr)) continue;
    const p = board[sq(tf + df, tr + dr)];
    if (p && p.color === by && p.type === 'N') return true;
  }
  for (const [df, dr] of KING) {
    if (!onBoard(tf + df, tr + dr)) continue;
    const p = board[sq(tf + df, tr + dr)];
    if (p && p.color === by && p.type === 'K') return true;
  }
  const slide = (dirs: number[][], types: PieceType[]) => {
    for (const [df, dr] of dirs) {
      let f = tf + df;
      let r = tr + dr;
      while (onBoard(f, r)) {
        const p = board[sq(f, r)];
        if (p) {
          if (p.color === by && types.includes(p.type)) return true;
          break;
        }
        f += df;
        r += dr;
      }
    }
    return false;
  };
  return slide(ROOK, ['R', 'Q']) || slide(BISHOP, ['B', 'Q']);
}

export function findKing(board: Board, color: Color): number {
  return board.findIndex((p) => p !== null && p.type === 'K' && p.color === color);
}

export function inCheck(board: Board, color: Color): boolean {
  const k = findKing(board, color);
  return k >= 0 && isAttacked(board, k, other(color));
}

export interface GenOptions {
  /** Mover la pieza como si fuera de otro tipo (carta Comodín) */
  asType?: PieceType;
  /** IDs de piezas que no se pueden capturar (Escudo) */
  shielded?: Set<string>;
}

/** Movimientos pseudo-legales (sin comprobar si el propio rey queda en jaque). */
export function pseudoMoves(board: Board, from: number, opts: GenOptions = {}): Move[] {
  const piece = board[from];
  if (!piece) return [];
  const type = opts.asType ?? piece.type;
  const f0 = fileOf(from);
  const r0 = rankOf(from);
  const moves: Move[] = [];
  // El rey nunca se captura y las piezas con escudo tampoco
  const canLand = (t: number) => {
    const target = board[t];
    if (!target) return true;
    if (target.color === piece.color || target.type === 'K') return false;
    return !opts.shielded?.has(target.id);
  };
  const add = (t: number) => {
    const promo = piece.type === 'P' && rankOf(t) === lastRank(piece.color);
    moves.push(promo ? { from, to: t, promo } : { from, to: t });
  };
  const steps = (dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      if (!onBoard(f0 + df, r0 + dr)) continue;
      const t = sq(f0 + df, r0 + dr);
      if (canLand(t)) add(t);
    }
  };
  const slides = (dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      let f = f0 + df;
      let r = r0 + dr;
      while (onBoard(f, r)) {
        const t = sq(f, r);
        if (board[t]) {
          if (canLand(t)) add(t);
          break;
        }
        add(t);
        f += df;
        r += dr;
      }
    }
  };

  switch (type) {
    case 'N':
      steps(KNIGHT);
      break;
    case 'B':
      slides(BISHOP);
      break;
    case 'R':
      slides(ROOK);
      break;
    case 'Q':
      slides([...ROOK, ...BISHOP]);
      break;
    case 'K':
      steps(KING);
      if (piece.type === 'K' && !piece.moved) addCastles(board, from, piece, moves);
      break;
    case 'P': {
      const d = pawnDir(piece.color);
      const r1 = r0 + d;
      if (onBoard(f0, r1) && !board[sq(f0, r1)]) {
        add(sq(f0, r1));
        const startRank = piece.color === 'w' ? 1 : 6;
        if (r0 === startRank && !board[sq(f0, r1 + d)]) add(sq(f0, r1 + d));
      }
      for (const df of [-1, 1]) {
        if (!onBoard(f0 + df, r1)) continue;
        const t = sq(f0 + df, r1);
        if (board[t] && canLand(t)) add(t);
      }
      break;
    }
  }
  return moves;
}

function addCastles(board: Board, from: number, king: Piece, moves: Move[]) {
  const enemy = other(king.color);
  if (isAttacked(board, from, enemy)) return;
  const r = rankOf(from);
  if (fileOf(from) !== 4) return;
  const tryCastle = (rookFile: number, side: 'K' | 'Q') => {
    const rook = board[sq(rookFile, r)];
    if (!rook || rook.type !== 'R' || rook.color !== king.color || rook.moved) return;
    const step = rookFile > 4 ? 1 : -1;
    for (let f = 4 + step; f !== rookFile; f += step) if (board[sq(f, r)]) return;
    // El rey no puede pasar por casillas atacadas
    if (isAttacked(board, sq(4 + step, r), enemy) || isAttacked(board, sq(4 + 2 * step, r), enemy)) return;
    moves.push({ from, to: sq(4 + 2 * step, r), castle: side });
  };
  tryCastle(7, 'K');
  tryCastle(0, 'Q');
}

/** Aplica un movimiento y devuelve el tablero nuevo y la pieza capturada. */
export function applyMove(
  board: Board,
  move: Move,
  promoType: PieceType = 'Q',
): { board: Board; captured: Piece | null } {
  const next = board.slice();
  const piece = next[move.from]!;
  const captured = next[move.to];
  const moved: Piece = { ...piece, moved: true };
  if (move.promo) moved.type = promoType;
  next[move.to] = moved;
  next[move.from] = null;
  if (move.castle) {
    const r = rankOf(move.from);
    const rookFrom = sq(move.castle === 'K' ? 7 : 0, r);
    const rookTo = sq(move.castle === 'K' ? 5 : 3, r);
    next[rookTo] = { ...next[rookFrom]!, moved: true };
    next[rookFrom] = null;
  }
  return { board: next, captured };
}

/** Movimientos legales: los pseudo-legales que no dejan al propio rey en jaque. */
export function legalMoves(board: Board, from: number, opts: GenOptions = {}): Move[] {
  const piece = board[from];
  if (!piece) return [];
  return pseudoMoves(board, from, opts).filter((m) => !inCheck(applyMove(board, m).board, piece.color));
}

export function hasAnyLegalMove(board: Board, color: Color, opts: GenOptions & { frozen?: Set<string> } = {}) {
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || p.color !== color || opts.frozen?.has(p.id)) continue;
    if (legalMoves(board, s, opts).length > 0) return true;
  }
  return false;
}

export function insufficientMaterial(board: Board): boolean {
  const pieces = board.filter((p): p is Piece => p !== null && p.type !== 'K');
  if (pieces.length === 0) return true;
  return pieces.length === 1 && (pieces[0].type === 'B' || pieces[0].type === 'N');
}

export function positionKey(board: Board, toMove: Color): string {
  return board.map((p) => (p ? (p.color === 'w' ? p.type : p.type.toLowerCase()) : '.')).join('') + toMove;
}
