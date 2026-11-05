import type { Card, CardKind } from '../engine/types';
import { useT } from '../i18n';
import { CardView } from './CardView';

const EXAMPLES: Card[] = (
  [
    ['number', 'red', 3],
    ['plus2', 'blue'],
    ['skip', 'green'],
    ['reverse', 'yellow'],
    ['wild', 'black'],
    ['revive', 'black'],
    ['shield', 'black'],
    ['teleport', 'black'],
    ['freeze', 'black'],
  ] as [CardKind, Card['color'], number?][]
).map(([kind, color, value], i) => ({ id: `r${i}`, kind, color, value }));

export function Rules({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal px rules" onClick={(e) => e.stopPropagation()}>
        <h2>{t.howToPlay}</h2>
        <ul className="rule-list">
          {t.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h3>{t.zones}</h3>
        <div className="zone-map">
          <div className="z-green">a5–d8</div>
          <div className="z-yellow">e5–h8</div>
          <div className="z-red">a1–d4</div>
          <div className="z-blue">e1–h4</div>
        </div>
        <div className="card-list">
          {EXAMPLES.map((c) => (
            <div key={c.id} className="card-row">
              <CardView card={c} small />
              <div>
                <strong>{t.cards[c.kind][0]}</strong>
                <p>{t.cards[c.kind][1]}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn primary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  );
}
