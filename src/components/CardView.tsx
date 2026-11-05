import type { Card } from '../engine/types';
import { useT } from '../i18n';
import type { IconName } from '../pixel/sprites';
import { Icon } from './Pixel';

const ICON: Partial<Record<Card['kind'], IconName>> = {
  skip: 'skip',
  reverse: 'reverse',
  wild: 'wild',
  shield: 'shield',
  teleport: 'teleport',
  freeze: 'freeze',
};

const TEXT: Partial<Record<Card['kind'], string>> = { plus2: '+2', revive: '+1' };

const INK: Record<Card['color'], string> = {
  red: '#e03131',
  blue: '#1c7ed6',
  green: '#2f9e44',
  yellow: '#f59f00',
  black: '#212529',
};

interface Props {
  card?: Card;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function Symbol({ card, big }: { card: Card; big?: boolean }) {
  const icon = ICON[card.kind];
  if (icon) return <Icon name={icon} color={big ? INK[card.color] : '#fff'} />;
  return <span className="txt">{card.kind === 'number' ? card.value : TEXT[card.kind]}</span>;
}

export function CardView({ card, selected, small, onClick, disabled }: Props) {
  const t = useT();
  if (!card) {
    return (
      <div className={`card back ${small ? 'small' : ''}`}>
        <div className="window">
          <span className="back-logo">UC</span>
        </div>
      </div>
    );
  }
  const label = card.kind === 'number' ? '' : t.cards[card.kind][0];
  const button = (
    <button
      type="button"
      className={`card ${card.color} ${selected ? 'selected' : ''} ${small ? 'small' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={card.kind === 'number' ? `${card.value}` : label}
    >
      {!small && (
        <span className="corner tl">
          <Symbol card={card} />
        </span>
      )}
      <div className="window" style={{ color: INK[card.color] }}>
        <Symbol card={card} big />
      </div>
      {!small && (
        <span className="corner br">
          <Symbol card={card} />
        </span>
      )}
    </button>
  );
  if (small) return button;
  // La etiqueta va fuera del botón porque el recorte de esquinas la ocultaría
  return (
    <div className={`card-slot ${selected ? 'selected' : ''}`}>
      {button}
      <span className="card-label">{label}</span>
    </div>
  );
}
