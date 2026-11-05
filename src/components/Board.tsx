import { fileOf, findKing, inCheck, rankOf } from '../engine/chess';
import { zoneOf } from '../engine/cards';
import type { Board as BoardT, CardColor, Color, PieceType } from '../engine/types';

const GLYPH: Record<PieceType, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
// ︎ fuerza el glifo de texto en vez del emoji en móviles
export const glyph = (t: PieceType) => GLYPH[t] + '︎';

interface Props {
  board: BoardT;
  /** Color que se ve abajo */
  bottom: Color;
  selected: number[];
  targets: number[];
  lastMove: { from: number; to: number } | null;
  /** Zona resaltada por la carta numérica elegida */
  zone: Exclude<CardColor, 'black'> | null;
  shielded: Set<string>;
  frozen: Set<string>;
  onSquare: (sq: number) => void;
}

export function Board({ board, bottom, selected, targets, lastMove, zone, shielded, frozen, onSquare }: Props) {
  const pos = (s: number) => {
    const f = fileOf(s);
    const r = rankOf(s);
    return bottom === 'w' ? { x: f, y: 7 - r } : { x: 7 - f, y: r };
  };
  const checks = (['w', 'b'] as Color[]).filter((c) => inCheck(board, c)).map((c) => findKing(board, c));

  const squares = [];
  for (let s = 0; s < 64; s++) {
    const { x, y } = pos(s);
    const dark = (fileOf(s) + rankOf(s)) % 2 === 0;
    const z = zoneOf(s);
    const cls = [
      'sq',
      dark ? 'dark' : 'light',
      `z-${z}`,
      zone === z ? 'zone-on' : '',
      lastMove && (lastMove.from === s || lastMove.to === s) ? 'last' : '',
      selected.includes(s) ? 'sel' : '',
      checks.includes(s) ? 'check' : '',
    ].join(' ');
    const isTarget = targets.includes(s);
    squares.push(
      <button
        type="button"
        key={s}
        className={cls}
        style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }}
        onClick={() => onSquare(s)}
        aria-label={'abcdefgh'[fileOf(s)] + (rankOf(s) + 1)}
      >
        {isTarget && <span className={board[s] ? 'target capture' : 'target'} />}
        {x === 0 && <span className="coord rank">{rankOf(s) + 1}</span>}
        {y === 7 && <span className="coord file">{'abcdefgh'[fileOf(s)]}</span>}
      </button>,
    );
  }

  const pieces = [];
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const { x, y } = pos(s);
    pieces.push(
      <div
        key={p.id}
        className={`piece ${p.color === 'w' ? 'white' : 'black'} ${frozen.has(p.id) ? 'frozen' : ''}`}
        style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}
      >
        {glyph(p.type)}
        {shielded.has(p.id) && <span className="badge">🛡️</span>}
        {frozen.has(p.id) && <span className="badge">❄️</span>}
      </div>,
    );
  }

  return (
    <div className="board">
      {squares}
      <div className="pieces">{pieces}</div>
    </div>
  );
}
