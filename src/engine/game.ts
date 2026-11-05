import {
  applyMove,
  distance,
  hasAnyLegalMove,
  inCheck,
  initialBoard,
  insufficientMaterial,
  lastRank,
  legalMoves,
  positionKey,
  rankOf,
  squareName,
} from './chess';
import { HAND_SIZE, buildDeck, shuffle, zoneOf } from './cards';
import type { Action, Card, Color, GameState, Move, Piece, PieceType, Seat } from './types';

/** Error de regla; `key` se traduce en la interfaz */
export class GameError extends Error {
  constructor(public key: string) {
    super(key);
  }
}

export const DISGUISES: PieceType[] = ['N', 'B', 'R', 'Q'];
const PROMOTIONS: PieceType[] = ['Q', 'R', 'B', 'N'];
const NO_MOVE_LIMIT = 0;

export interface NewGameOptions {
  names: [string, string];
  avatars?: [string, string];
  /** Minutos por jugador; null = sin límite */
  minutes: number | null;
  /** Asiento que juega con blancas */
  whiteSeat?: Seat;
  now?: number;
  rand?: () => number;
}

export function newGame(opts: NewGameOptions): GameState {
  const rand = opts.rand ?? Math.random;
  const whiteSeat = opts.whiteSeat ?? 0;
  const deck = shuffle(buildDeck(), rand);
  const hands: [Card[], Card[]] = [deck.splice(0, HAND_SIZE), deck.splice(0, HAND_SIZE)];
  const board = initialBoard();
  const ms = opts.minutes ? opts.minutes * 60_000 : null;
  return {
    board,
    seatColor: whiteSeat === 0 ? ['w', 'b'] : ['b', 'w'],
    names: opts.names,
    avatars: opts.avatars ?? ['crown-m', 'crown-f'],
    turn: whiteSeat,
    turnNumber: 1,
    hands,
    deck,
    discard: [],
    captured: [],
    shields: [],
    frozen: [],
    pending: null,
    lastMove: null,
    lastCard: null,
    log: [],
    halfmoveClock: 0,
    repetition: { [positionKey(board, 'w')]: 1 },
    result: null,
    clock: ms ? { remaining: [ms, ms], turnStartedAt: opts.now ?? Date.now(), initial: ms } : null,
  };
}

export const otherSeat = (s: Seat): Seat => (s === 0 ? 1 : 0);
export const colorOf = (state: GameState, seat: Seat): Color => state.seatColor[seat];

export function shieldedIds(state: GameState) {
  return new Set(state.shields.map((s) => s.pieceId));
}

export function frozenIds(state: GameState, seat: Seat) {
  return new Set(state.frozen.filter((f) => f.seat === seat).map((f) => f.pieceId));
}

export function seatInCheck(state: GameState, seat: Seat) {
  return inCheck(state.board, colorOf(state, seat));
}

/**
 * ¿La carta permite este movimiento (sin contar la excepción del jaque)?
 * Las cartas numéricas funcionan como en el UNO, por color O por número:
 * vale cualquier movimiento que salga o llegue a su zona (a cualquier distancia)
 * o cualquier movimiento de como máximo N casillas (en cualquier parte).
 */
export function cardAllowsMove(card: Card, move: Move): boolean {
  if (card.kind === 'number') {
    const byColor = zoneOf(move.from) === card.color || zoneOf(move.to) === card.color;
    const limit = card.value ?? NO_MOVE_LIMIT;
    const byNumber = limit === NO_MOVE_LIMIT || distance(move.from, move.to) <= limit;
    return byColor || byNumber;
  }
  return card.kind === 'plus2' || card.kind === 'skip';
}

export interface MoveQuery {
  card?: Card | null;
  disguise?: PieceType;
  /** Ignorar la carta (solo permitido estando en jaque) */
  free?: boolean;
}

/** Movimientos que `seat` puede hacer con la pieza de `from` según la carta elegida. */
export function movesFor(state: GameState, seat: Seat, from: number, q: MoveQuery): Move[] {
  const piece = state.board[from];
  if (!piece || piece.color !== colorOf(state, seat)) return [];
  if (frozenIds(state, seat).has(piece.id)) return [];
  const shielded = shieldedIds(state);

  if (state.pending) {
    if (state.pending.moved.includes(piece.id)) return [];
    return legalMoves(state.board, from, { shielded });
  }
  if (q.free) return legalMoves(state.board, from, { shielded });
  const card = q.card;
  if (!card) return [];
  if (card.kind === 'wild') {
    if (!q.disguise || !DISGUISES.includes(q.disguise) || piece.type === 'K') return [];
    return legalMoves(state.board, from, { shielded, asType: q.disguise });
  }
  if (card.kind !== 'number' && card.kind !== 'plus2' && card.kind !== 'skip') return [];
  return legalMoves(state.board, from, { shielded }).filter((m) => cardAllowsMove(card, m));
}

const clone = (s: GameState): GameState => structuredClone(s);

function drawOne(state: GameState, rand: () => number) {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return;
    state.deck = shuffle(state.discard, rand);
    state.discard = [];
  }
  return state.deck.pop();
}

function takeCard(state: GameState, seat: Seat, cardId: string | undefined): Card {
  const hand = state.hands[seat];
  const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) throw new GameError('noCard');
  const [card] = hand.splice(i, 1);
  state.discard.push(card);
  state.lastCard = { card, seat };
  return card;
}

function pieceAt(state: GameState, square: number): Piece {
  const p = state.board[square];
  if (!p) throw new GameError('noPiece');
  return p;
}

function doMove(state: GameState, seat: Seat, move: Move, promo: PieceType | undefined, card?: Card) {
  const piece = state.board[move.from]!;
  const promoType = promo && PROMOTIONS.includes(promo) ? promo : 'Q';
  const { board, captured } = applyMove(state.board, move, promoType);
  state.board = board;
  if (captured) {
    state.captured.push(captured);
    state.shields = state.shields.filter((s) => s.pieceId !== captured.id);
    state.frozen = state.frozen.filter((f) => f.pieceId !== captured.id);
  }
  state.halfmoveClock = captured || piece.type === 'P' ? 0 : state.halfmoveClock + 1;
  state.lastMove = { from: move.from, to: move.to };
  state.log.push({ seat, card, text: `${squareName(move.from)}→${squareName(move.to)}${captured ? '×' : ''}` });
}

/** Comprueba que el jugador no deja a su propio rey en jaque tras un efecto */
function assertNotInCheck(state: GameState, seat: Seat) {
  if (seatInCheck(state, seat)) throw new GameError('stillInCheck');
}

function finishTurn(state: GameState, skipOpponent: boolean, now: number, rand: () => number) {
  const seat = state.turn;
  const opp = otherSeat(seat);

  // Reloj
  if (state.clock) {
    state.clock.remaining[seat] -= now - state.clock.turnStartedAt;
    state.clock.turnStartedAt = now;
    if (state.clock.remaining[seat] <= 0) {
      state.clock.remaining[seat] = 0;
      state.result = { winner: opp, reason: 'time' };
      return;
    }
  }

  // Robar hasta completar la mano
  while (state.hands[seat].length < HAND_SIZE) {
    const c = drawOne(state, rand);
    if (!c) break;
    state.hands[seat].push(c);
  }

  state.frozen = state.frozen.filter((f) => f.seat !== seat);
  // El bloqueo no se aplica si el rival está en jaque: siempre puede defenderse
  const next: Seat = skipOpponent && !seatInCheck(state, opp) ? seat : opp;
  state.turn = next;
  state.turnNumber++;
  state.pending = null;
  state.shields = state.shields.filter((s) => s.seat !== next);

  const color = colorOf(state, next);
  const key = positionKey(state.board, color);
  state.repetition[key] = (state.repetition[key] ?? 0) + 1;

  if (!hasAnyLegalMove(state.board, color, { shielded: shieldedIds(state), frozen: frozenIds(state, next) })) {
    state.result = inCheck(state.board, color)
      ? { winner: otherSeat(next), reason: 'mate' }
      : { winner: null, reason: 'stalemate' };
  } else if (insufficientMaterial(state.board)) {
    state.result = { winner: null, reason: 'material' };
  } else if (state.repetition[key] >= 3) {
    state.result = { winner: null, reason: 'repetition' };
  } else if (state.halfmoveClock >= 100) {
    state.result = { winner: null, reason: 'fifty' };
  }
}

/** Tiempo restante de un asiento en este instante */
export function timeLeft(state: GameState, seat: Seat, now: number): number | null {
  if (!state.clock) return null;
  const base = state.clock.remaining[seat];
  return seat === state.turn && !state.result ? Math.max(0, base - (now - state.clock.turnStartedAt)) : base;
}

/**
 * Aplica la acción de `seat` y devuelve el estado nuevo.
 * Lanza GameError si la acción no está permitida.
 */
export function applyAction(
  prev: GameState,
  seat: Seat,
  action: Action,
  now: number = Date.now(),
  rand: () => number = Math.random,
): GameState {
  if (prev.result) throw new GameError('gameOver');
  const state = clone(prev);

  if (action.type === 'resign') {
    state.result = { winner: otherSeat(seat), reason: 'resign' };
    return state;
  }
  if (action.type === 'timeout') {
    const left = timeLeft(state, state.turn, now);
    if (left === null || left > 0) throw new GameError('notTimeout');
    state.clock!.remaining[state.turn] = 0;
    state.result = { winner: otherSeat(state.turn), reason: 'time' };
    return state;
  }

  if (seat !== state.turn) throw new GameError('notYourTurn');
  const myColor = colorOf(state, seat);
  const checked = inCheck(state.board, myColor);

  // Segundo movimiento de la carta +2
  if (state.pending) {
    if (action.type === 'endTurn') {
      finishTurn(state, false, now, rand);
      return state;
    }
    if (action.type !== 'move') throw new GameError('finishPlus2');
    const move = movesFor(state, seat, action.from, {}).find((m) => m.to === action.to);
    if (!move) throw new GameError('illegalMove');
    doMove(state, seat, move, action.promo);
    finishTurn(state, false, now, rand);
    return state;
  }

  switch (action.type) {
    case 'move': {
      const card = state.hands[seat].find((c) => c.id === action.cardId);
      if (!card) throw new GameError('noCard');
      let move = movesFor(state, seat, action.from, { card, disguise: action.disguise }).find((m) => m.to === action.to);
      let ignored = false;
      if (!move && checked) {
        // En jaque se puede ignorar la carta para salir del jaque
        move = movesFor(state, seat, action.from, { free: true }).find((m) => m.to === action.to);
        ignored = true;
      }
      if (!move) throw new GameError('illegalMove');
      const movedId = state.board[action.from]!.id;
      takeCard(state, seat, card.id);
      doMove(state, seat, move, action.promo, card);
      if (!ignored && card.kind === 'plus2') {
        // Solo hay segundo movimiento si existe alguna otra pieza que pueda moverse
        state.pending = { moved: [movedId] };
        const canContinue = state.board.some((p, s) => p && p.id !== movedId && movesFor(state, seat, s, {}).length > 0);
        if (!canContinue) finishTurn(state, false, now, rand);
        return state;
      }
      finishTurn(state, !ignored && card.kind === 'skip', now, rand);
      return state;
    }

    case 'revive': {
      const card = takeCard(state, seat, action.cardId);
      if (card.kind !== 'revive') throw new GameError('wrongCard');
      const i = state.captured.findIndex((p) => p.id === action.pieceId && p.color === myColor);
      if (i < 0) throw new GameError('noPiece');
      const piece = state.captured[i];
      // Si la casilla inicial está ocupada, la carta se pierde
      if (!state.board[piece.origin]) {
        state.captured.splice(i, 1);
        state.board[piece.origin] = { ...piece, type: piece.originType, moved: false };
        state.log.push({ seat, card, text: `+1 ${squareName(piece.origin)}` });
      } else {
        state.log.push({ seat, card, text: `+1 ✗` });
      }
      assertNotInCheck(state, seat);
      finishTurn(state, false, now, rand);
      return state;
    }

    case 'shield':
    case 'freeze': {
      const card = takeCard(state, seat, action.cardId);
      if (card.kind !== action.type) throw new GameError('wrongCard');
      const piece = pieceAt(state, action.square);
      if (piece.type === 'K') throw new GameError('notKing');
      if (action.type === 'shield') {
        if (piece.color !== myColor) throw new GameError('ownPiece');
        state.shields.push({ pieceId: piece.id, seat });
      } else {
        if (piece.color === myColor) throw new GameError('enemyPiece');
        state.frozen.push({ pieceId: piece.id, seat: otherSeat(seat) });
      }
      state.log.push({ seat, card, text: squareName(action.square) });
      assertNotInCheck(state, seat);
      finishTurn(state, false, now, rand);
      return state;
    }

    case 'teleport': {
      const card = takeCard(state, seat, action.cardId);
      if (card.kind !== 'teleport') throw new GameError('wrongCard');
      if (action.a === action.b) throw new GameError('twoPieces');
      const a = pieceAt(state, action.a);
      const b = pieceAt(state, action.b);
      if (a.color !== myColor || b.color !== myColor) throw new GameError('ownPiece');
      if (a.type === 'K' || b.type === 'K') throw new GameError('notKing');
      const badPawn = (p: Piece, to: number) =>
        p.type === 'P' && (rankOf(to) === lastRank(p.color) || rankOf(to) === lastRank(p.color === 'w' ? 'b' : 'w'));
      if (badPawn(a, action.b) || badPawn(b, action.a)) throw new GameError('pawnRank');
      state.board[action.a] = { ...b, moved: true };
      state.board[action.b] = { ...a, moved: true };
      if (seatInCheck(state, otherSeat(seat))) throw new GameError('teleportCheck');
      assertNotInCheck(state, seat);
      state.lastMove = { from: action.a, to: action.b };
      state.log.push({ seat, card, text: `${squareName(action.a)}⇄${squareName(action.b)}` });
      finishTurn(state, false, now, rand);
      return state;
    }

    case 'reverse': {
      const card = takeCard(state, seat, action.cardId);
      if (card.kind !== 'reverse') throw new GameError('wrongCard');
      state.seatColor = [state.seatColor[1], state.seatColor[0]];
      state.log.push({ seat, card, text: '⇅' });
      assertNotInCheck(state, seat);
      finishTurn(state, false, now, rand);
      return state;
    }

    case 'discard': {
      if (checked) throw new GameError('mustEscapeCheck');
      const card = takeCard(state, seat, action.cardId);
      state.log.push({ seat, card, text: '—' });
      finishTurn(state, false, now, rand);
      return state;
    }

    case 'endTurn':
      throw new GameError('noPending');
  }
}
