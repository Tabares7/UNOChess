import { describe, expect, it } from 'vitest';
import { initialBoard, inCheck, legalMoves, sq } from './chess';
import { buildDeck, zoneOf } from './cards';
import { GameError, applyAction, movesFor, newGame } from './game';
import type { Board, Card, GameState, Piece, PieceType, Color } from './types';

const s = (name: string) => sq('abcdefgh'.indexOf(name[0]), Number(name[1]) - 1);

function game(): GameState {
  return newGame({ names: ['A', 'B'], minutes: null, rand: () => 0.5, now: 0 });
}

function give(state: GameState, seat: 0 | 1, card: Omit<Card, 'id'>): string {
  const id = `t${Math.random()}`;
  state.hands[seat].push({ id, ...card });
  return id;
}

function emptyBoard(pieces: [string, Color, PieceType][]): Board {
  const b: Board = Array(64).fill(null);
  pieces.forEach(([at, color, type], i) => {
    const p: Piece = { id: `${color}${type}${i}`, type, color, origin: s(at), originType: type, moved: true };
    b[s(at)] = p;
  });
  return b;
}

describe('ajedrez', () => {
  it('genera 20 movimientos iniciales para blancas', () => {
    const b = initialBoard();
    let n = 0;
    for (let i = 0; i < 64; i++) if (b[i]?.color === 'w') n += legalMoves(b, i).length;
    expect(n).toBe(20);
  });

  it('detecta jaque', () => {
    const b = emptyBoard([['e1', 'w', 'K'], ['e8', 'b', 'R'], ['a8', 'b', 'K']]);
    expect(inCheck(b, 'w')).toBe(true);
  });
});

describe('cartas', () => {
  it('cuadrantes de color', () => {
    expect(zoneOf(s('a1'))).toBe('red');
    expect(zoneOf(s('h1'))).toBe('blue');
    expect(zoneOf(s('a8'))).toBe('green');
    expect(zoneOf(s('h8'))).toBe('yellow');
  });

  it('el mazo tiene 109 cartas', () => {
    expect(buildDeck()).toHaveLength(109);
  });

  it('carta numérica limita distancia y zona', () => {
    const g = game();
    const seat = g.turn;
    const card: Card = { id: 'x', kind: 'number', color: 'blue', value: 1 };
    // e2 está en la zona azul; con 1 casilla solo puede ir a e3
    expect(movesFor(g, seat, s('e2'), { card }).map((m) => m.to)).toEqual([s('e3')]);
    // a2 está en la zona roja y no puede llegar a la azul
    expect(movesFor(g, seat, s('a2'), { card })).toEqual([]);
  });

  it('+2 permite dos movimientos con piezas distintas', () => {
    let g = game();
    const seat = g.turn;
    const id = give(g, seat, { kind: 'plus2', color: 'red' });
    g = applyAction(g, seat, { type: 'move', cardId: id, from: s('e2'), to: s('e4') });
    expect(g.pending).not.toBeNull();
    expect(g.turn).toBe(seat);
    expect(() => applyAction(g, seat, { type: 'move', from: s('e4'), to: s('e5') })).toThrow(GameError);
    g = applyAction(g, seat, { type: 'move', from: s('d2'), to: s('d4') });
    expect(g.turn).not.toBe(seat);
  });

  it('Bloqueo hace que el rival pierda el turno', () => {
    let g = game();
    const seat = g.turn;
    const id = give(g, seat, { kind: 'skip', color: 'red' });
    g = applyAction(g, seat, { type: 'move', cardId: id, from: s('e2'), to: s('e4') });
    expect(g.turn).toBe(seat);
  });

  it('Reversa intercambia los colores', () => {
    let g = game();
    const seat = g.turn;
    const before = g.seatColor[seat];
    const id = give(g, seat, { kind: 'reverse', color: 'red' });
    g = applyAction(g, seat, { type: 'reverse', cardId: id });
    expect(g.seatColor[seat]).not.toBe(before);
    expect(g.hands[seat]).toHaveLength(3);
  });

  it('Comodín mueve un peón como caballo', () => {
    const g = game();
    const card: Card = { id: 'w', kind: 'wild', color: 'black' };
    const tos = movesFor(g, g.turn, s('e2'), { card, disguise: 'N' }).map((m) => m.to);
    expect(tos.sort()).toEqual([s('c3'), s('d4'), s('f4'), s('g3')].sort());
  });

  it('+1 ficha revive en la casilla inicial', () => {
    let g = game();
    const seat = g.turn;
    const pawn = g.board[s('a2')]!;
    g.board[s('a2')] = null;
    g.captured.push(pawn);
    const id = give(g, seat, { kind: 'revive', color: 'black' });
    g = applyAction(g, seat, { type: 'revive', cardId: id, pieceId: pawn.id });
    expect(g.board[s('a2')]?.id).toBe(pawn.id);
    expect(g.captured).toHaveLength(0);
  });

  it('Escudo impide capturar la pieza', () => {
    let g = game();
    g.board = emptyBoard([['e1', 'w', 'K'], ['a8', 'b', 'K'], ['d4', 'w', 'N'], ['d8', 'b', 'R']]);
    const seat = g.turn;
    const id = give(g, seat, { kind: 'shield', color: 'black' });
    g = applyAction(g, seat, { type: 'shield', cardId: id, square: s('d4') });
    const opp = g.turn;
    const card: Card = { id: 'n', kind: 'number', color: 'red', value: 0 };
    expect(movesFor(g, opp, s('d8'), { card }).map((m) => m.to)).not.toContain(s('d4'));
  });

  it('en jaque se puede ignorar la carta', () => {
    let g = game();
    g.board = emptyBoard([['e1', 'w', 'K'], ['a8', 'b', 'K'], ['e8', 'b', 'R']]);
    const seat = g.turn;
    const id = give(g, seat, { kind: 'number', color: 'green', value: 1 });
    g = applyAction(g, seat, { type: 'move', cardId: id, from: s('e1'), to: s('d1') });
    expect(g.board[s('d1')]?.type).toBe('K');
  });

  it('detecta jaque mate al terminar el turno', () => {
    let g = game();
    g.board = emptyBoard([['g1', 'w', 'K'], ['f2', 'w', 'P'], ['g2', 'w', 'P'], ['h2', 'w', 'P'], ['a8', 'b', 'K'], ['a7', 'b', 'R']]);
    // Le toca a las negras
    g.turn = g.seatColor[0] === 'b' ? 0 : 1;
    const id = give(g, g.turn, { kind: 'number', color: 'green', value: 0 });
    const winner = g.turn;
    g = applyAction(g, g.turn, { type: 'move', cardId: id, from: s('a7'), to: s('a1') });
    expect(g.result).toEqual({ winner, reason: 'mate' });
  });
});
