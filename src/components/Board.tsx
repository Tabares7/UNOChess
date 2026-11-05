import { fileOf, findKing, inCheck, rankOf } from '../engine/chess';
import { zoneOf } from '../engine/cards';
import type { Board as BoardT, CardColor, Color } from '../engine/types';
import { Icon, PieceSprite } from './Pixel';

interface Props {
  board: BoardT;
  /** Color que se ve abajo */
  bottom: Color;
  selected: number[];
  targets: number[];
  lastMove: { from: number; to: number } | null;
  /** Zona resaltada por la carta numérica elegida */
  zone: Exclude<CardColor, 'black'> | null;
  /** Color del marco (el de la última carta jugada) */
  frame: CardColor;
  shielded: Set<string>;
  frozen: Set<string>;
  onSquare: (sq: number) => void;
}

export function Board({ board, bottom, selected, targets, lastMove, zone, frame, shielded, frozen, onSquare }: Props) {
  const pos = (s: number) => {
    const f = fileOf(s);
    const r = rankOf(s);
    return bottom === 'w' ? { x: f, y: 7 - r } : { x: 7 - f, y: r };
  };
  const checks = (['w', 'b'] as Color[]).filter((c) => inCheck(board, c)).map((c) => findKing(board, c));
  const files = bottom === 'w' ? 'abcdefgh' : 'hgfedcba';
  const ranks = bottom === 'w' ? '87654321' : '12345678';

  const squares = [];
  for (let s = 0; s < 64; s++) {
    const { x, y } = pos(s);
    const dark = (fileOf(s) + rankOf(s)) % 2 === 0;
    const z = zoneOf(s);
    const cls = [
      'sq',
      `z-${z}`,
      dark ? 'dark' : 'light',
      zone && zone !== z ? 'dim' : '',
      lastMove && (lastMove.from === s || lastMove.to === s) ? 'last' : '',
      selected.includes(s) ? 'sel' : '',
      checks.includes(s) ? 'check' : '',
    ].join(' ');
    squares.push(
      <button
        type="button"
        key={s}
        className={cls}
        style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }}
        onClick={() => onSquare(s)}
        aria-label={'abcdefgh'[fileOf(s)] + (rankOf(s) + 1)}
      >
        {targets.includes(s) && <span className={board[s] ? 'target capture' : 'target'} />}
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
        className={`piece ${frozen.has(p.id) ? 'frozen' : ''}`}
        style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}
      >
        <PieceSprite type={p.type} color={p.color} />
        {shielded.has(p.id) && (
          <span className="badge">
            <Icon name="shield" color="#ffd43b" />
          </span>
        )}
        {frozen.has(p.id) && (
          <span className="badge">
            <Icon name="freeze" color="#99e9f2" />
          </span>
        )}
      </div>,
    );
  }

  return (
    <div className={`board-frame px frame-${frame}`}>
      <div className="board-row">
        <div className="coords ranks">
          {[...ranks].map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
        <div className="board">
          {squares}
          <div className="pieces">{pieces}</div>
        </div>
      </div>
      <div className="coords files">
        {[...files].map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
    </div>
  );
}
