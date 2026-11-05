import { describe, expect, it } from 'vitest';
import { AVATARS, avatarUrl } from './avatars';
import { PIECE_H, PIECE_W, drawPieceForTest } from './pieces';
import { ICONS } from './sprites';
import type { PieceType } from '../engine/types';

describe('sprites', () => {
  it('los iconos son rectangulares', () => {
    for (const [name, grid] of Object.entries(ICONS)) {
      for (const row of grid) expect(row.length, `${name}: "${row}"`).toBe(grid[0].length);
    }
  });

  it('las piezas caben en su lienzo y no tocan el borde superior', () => {
    for (const t of ['K', 'Q', 'R', 'B', 'N', 'P'] as PieceType[]) {
      const px = drawPieceForTest(t, 'w');
      expect(px.w).toBe(PIECE_W);
      expect(px.h).toBe(PIECE_H);
      expect(px.c.filter(Boolean).length, t).toBeGreaterThan(80);
    }
  });

  it('hay 12 avatares y todos se dibujan', () => {
    expect(AVATARS).toHaveLength(12);
    for (const a of AVATARS) expect(avatarUrl(a.id)).toMatch(/^data:image\/svg\+xml/);
  });
});
