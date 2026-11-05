import { describe, expect, it } from 'vitest';
import { AVATARS, allGrids } from './sprites';

describe('sprites', () => {
  it('todas las cuadrículas son rectangulares', () => {
    for (const [name, grid] of allGrids()) {
      const w = grid[0].length;
      for (const row of grid) expect(row.length, `${name}: "${row}"`).toBe(w);
    }
  });

  it('hay 12 avatares', () => {
    expect(AVATARS).toHaveLength(12);
  });
});
