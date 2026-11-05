import type { Card } from '../engine/types';
import { useT } from '../i18n';

const SYMBOL: Record<Card['kind'], string> = {
  number: '',
  plus2: '+2',
  skip: '⊘',
  reverse: '⇅',
  wild: '★',
  revive: '+1',
  shield: '🛡️',
  teleport: '🌀',
  freeze: '❄️',
};

export const cardSymbol = (card: Card) => (card.kind === 'number' ? String(card.value) : SYMBOL[card.kind]);

interface Props {
  card?: Card;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function CardView({ card, selected, small, onClick, disabled }: Props) {
  const t = useT();
  if (!card) {
    return (
      <div className={`card back ${small ? 'small' : ''}`}>
        <div className="oval">
          <span className="back-logo">UC</span>
        </div>
      </div>
    );
  }
  const sym = cardSymbol(card);
  const label = card.kind === 'number' ? '' : t.cards[card.kind][0];
  return (
    <button
      type="button"
      className={`card ${card.color} ${selected ? 'selected' : ''} ${small ? 'small' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={card.kind === 'number' ? `${card.value}` : label}
    >
      <span className="corner tl">{sym}</span>
      <div className="oval">
        <span className="sym">{sym}</span>
      </div>
      {!small && label && <span className="card-label">{label}</span>}
      <span className="corner br">{sym}</span>
    </button>
  );
}
