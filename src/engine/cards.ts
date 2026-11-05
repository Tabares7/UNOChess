import { fileOf, rankOf } from './chess';
import type { Card, CardColor, CardKind } from './types';

export const ZONE_COLORS: Exclude<CardColor, 'black'>[] = ['red', 'blue', 'green', 'yellow'];
export const HAND_SIZE = 3;

/**
 * Cada color es un cuadrante de 4x4 (desde el punto de vista de las blancas):
 * rojo = a1–d4, azul = e1–h4, verde = a5–d8, amarillo = e5–h8.
 */
export function zoneOf(s: number): Exclude<CardColor, 'black'> {
  const right = fileOf(s) >= 4;
  const top = rankOf(s) >= 4;
  if (!top) return right ? 'blue' : 'red';
  return right ? 'yellow' : 'green';
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  let n = 0;
  const add = (kind: CardKind, color: CardColor, value?: number) =>
    deck.push(value === undefined ? { id: `c${n++}`, kind, color } : { id: `c${n++}`, kind, color, value });
  for (const color of ZONE_COLORS) {
    add('number', color, 0);
    for (let v = 1; v <= 9; v++) {
      add('number', color, v);
      add('number', color, v);
    }
    add('plus2', color);
    add('plus2', color);
    add('skip', color);
    add('reverse', color);
  }
  for (let i = 0; i < 4; i++) {
    add('wild', 'black');
    add('revive', 'black');
  }
  for (let i = 0; i < 3; i++) {
    add('shield', 'black');
    add('teleport', 'black');
    add('freeze', 'black');
  }
  return deck;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Cartas que se juegan moviendo una pieza */
export const isMoveCard = (c: Card) => c.kind === 'number' || c.kind === 'plus2' || c.kind === 'skip' || c.kind === 'wild';
