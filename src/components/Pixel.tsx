import type { Color, PieceType } from '../engine/types';
import { avatarBg, avatarUrl, iconUrl, pieceUrl, type IconName } from '../pixel/sprites';

export function PieceSprite({ type, color, className }: { type: PieceType; color: Color; className?: string }) {
  return <img className={`sprite ${className ?? ''}`} src={pieceUrl(type, color)} alt={type} draggable={false} />;
}

export function Icon({ name, color = '#fff', size }: { name: IconName; color?: string; size?: number }) {
  return (
    <img
      className="sprite icon"
      src={iconUrl(name, color)}
      alt=""
      draggable={false}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}

export function Avatar({ id, size = 48, className }: { id: string; size?: number; className?: string }) {
  return (
    <div className={`avatar bg-${avatarBg(id)} ${className ?? ''}`} style={{ width: size, height: size }}>
      <img className="sprite" src={avatarUrl(id)} alt="" draggable={false} />
    </div>
  );
}
