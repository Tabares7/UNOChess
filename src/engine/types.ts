export type Color = 'w' | 'b';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type Seat = 0 | 1;

export interface Piece {
  id: string;
  type: PieceType;
  color: Color;
  /** Casilla inicial (se usa para revivir) */
  origin: number;
  originType: PieceType;
  moved: boolean;
}

/** 64 casillas, índice = fila * 8 + columna. Fila 0 = rango "1", columna 0 = "a". */
export type Board = (Piece | null)[];

export interface Move {
  from: number;
  to: number;
  castle?: 'K' | 'Q';
  promo?: boolean;
}

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardKind =
  | 'number'
  | 'plus2'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'revive'
  | 'shield'
  | 'teleport'
  | 'freeze';

export interface Card {
  id: string;
  kind: CardKind;
  color: CardColor;
  value?: number;
}

export type ResultReason =
  | 'mate'
  | 'resign'
  | 'time'
  | 'stalemate'
  | 'repetition'
  | 'fifty'
  | 'material';

export interface GameResult {
  winner: Seat | null;
  reason: ResultReason;
}

export interface LogEntry {
  seat: Seat;
  card?: Card;
  text: string;
}

export interface GameState {
  board: Board;
  /** Color que controla cada asiento (cambia con la carta Reversa) */
  seatColor: [Color, Color];
  names: [string, string];
  /** Avatar de cada asiento (id de src/pixel/sprites) */
  avatars: [string, string];
  turn: Seat;
  turnNumber: number;
  hands: [Card[], Card[]];
  deck: Card[];
  discard: Card[];
  captured: Piece[];
  /** Piezas protegidas: se quitan al empezar el siguiente turno de `seat` */
  shields: { pieceId: string; seat: Seat }[];
  /** Piezas congeladas: no pueden moverse durante el próximo turno de `seat` */
  frozen: { pieceId: string; seat: Seat }[];
  /** Segundo movimiento pendiente de la carta +2 */
  pending: { moved: string[] } | null;
  lastMove: { from: number; to: number } | null;
  lastCard: { card: Card; seat: Seat } | null;
  log: LogEntry[];
  halfmoveClock: number;
  repetition: Record<string, number>;
  result: GameResult | null;
  clock: { remaining: [number, number]; turnStartedAt: number; initial: number } | null;
}

export type Action =
  | { type: 'move'; cardId?: string; from: number; to: number; promo?: PieceType; disguise?: PieceType }
  | { type: 'endTurn' }
  | { type: 'revive'; cardId: string; pieceId: string }
  | { type: 'shield'; cardId: string; square: number }
  | { type: 'freeze'; cardId: string; square: number }
  | { type: 'teleport'; cardId: string; a: number; b: number }
  | { type: 'reverse'; cardId: string }
  | { type: 'discard'; cardId: string }
  | { type: 'resign' }
  | { type: 'timeout' };
