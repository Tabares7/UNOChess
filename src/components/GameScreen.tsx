import { useEffect, useMemo, useRef, useState } from 'react';
import { inCheck } from '../engine/chess';
import { isMoveCard } from '../engine/cards';
import { DISGUISES, frozenIds, movesFor, otherSeat, seatInCheck, shieldedIds, timeLeft } from '../engine/game';
import type { Action, GameState, Move, PieceType, Seat } from '../engine/types';
import { fmt, useT } from '../i18n';
import { musicEnabled, setMusicEnabled, startMusic, stopMusic } from '../music';
import type { Controller } from '../net/useGame';
import { isMuted, play, setMuted } from '../sound';
import { Board } from './Board';
import { CardView } from './CardView';
import { Avatar, Icon, PieceSprite } from './Pixel';
import { Rules } from './Rules';

const EMOJIS = ['😀', '😂', '😮', '😡', '👏', '🔥'];

function formatClock(ms: number | null) {
  if (ms === null) return '';
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Fuerza un render periódico mientras corre el reloj */
function useTick(active: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [active]);
}

function useGameSounds(state: GameState, viewSeat: Seat, local: boolean) {
  const prev = useRef(state);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (p === state) return;
    if (state.result && !p.result) {
      play(local || state.result.winner === viewSeat ? 'win' : state.result.winner === null ? 'pop' : 'lose');
      return;
    }
    if (state.lastCard?.card.id !== p.lastCard?.card.id) play('card');
    if (state.lastMove !== p.lastMove && state.lastMove) {
      setTimeout(() => play(state.captured.length > p.captured.length ? 'capture' : 'move'), 80);
    }
    if (inCheck(state.board, state.seatColor[state.turn]) && state.turnNumber !== p.turnNumber) {
      setTimeout(() => play('check'), 220);
    } else if (!local && state.turn === viewSeat && p.turn !== viewSeat) {
      setTimeout(() => play('turn'), 300);
    }
  }, [state, viewSeat, local]);
}

interface Props {
  ctl: Controller;
  onExit: () => void;
}

export function GameScreen({ ctl, onExit }: Props) {
  const t = useT();
  const state = ctl.state!;
  const local = ctl.mode === 'local';
  const seat = ctl.viewSeat;
  const opp = otherSeat(seat);
  const myColor = state.seatColor[seat];
  const myTurn = !state.result && state.turn === seat && ctl.status === 'playing';
  const checked = seatInCheck(state, seat);
  const hand = state.hands[seat];

  const [cardId, setCardId] = useState<string | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [disguise, setDisguise] = useState<PieceType | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [promo, setPromo] = useState<Move | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rules, setRules] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const [music, setMusic] = useState(musicEnabled);
  const [revealed, setRevealed] = useState<Seat | null>(null);

  useTick(!!state.clock && !state.result);
  useGameSounds(state, seat, local);

  useEffect(() => {
    startMusic();
    return stopMusic;
  }, []);

  // Al cambiar el turno o la fase, se limpia la selección
  useEffect(() => {
    setCardId(null);
    setFrom(null);
    setDisguise(null);
    setPicks([]);
    setPromo(null);
  }, [state.turnNumber, state.pending, state.seatColor]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const card = hand.find((c) => c.id === cardId) ?? null;
  const pending = state.pending;
  // En jaque cualquier carta sirve para mover libremente
  const moveMode = !!pending || (!!card && (isMoveCard(card) || checked));

  const targets = useMemo<Move[]>(() => {
    if (from === null || !myTurn) return [];
    if (pending) return movesFor(state, seat, from, {});
    if (!card) return [];
    const list = movesFor(state, seat, from, { card, disguise: disguise ?? undefined });
    if (!checked) return list;
    const free = movesFor(state, seat, from, { free: true });
    return [...list, ...free.filter((m) => !list.some((x) => x.to === m.to))];
  }, [from, myTurn, pending, card, disguise, checked, state, seat]);

  const send = (action: Action) => {
    const err = ctl.act(action);
    if (err) {
      play('error');
      setToast(t.errors[err] ?? err);
    }
  };

  const sendMove = (m: Move, promoType?: PieceType) => {
    send({
      type: 'move',
      cardId: pending ? undefined : cardId ?? undefined,
      from: m.from,
      to: m.to,
      promo: promoType,
      disguise: card?.kind === 'wild' ? disguise ?? undefined : undefined,
    });
    setFrom(null);
    setPromo(null);
  };

  const onSquare = (s: number) => {
    if (!myTurn) return;
    const p = state.board[s];
    if (moveMode) {
      const m = targets.find((x) => x.to === s);
      if (from !== null && m) {
        if (m.promo) setPromo(m);
        else sendMove(m);
        return;
      }
      if (p && p.color === myColor) {
        if (from !== s) setDisguise(null);
        setFrom(from === s ? null : s);
      } else setFrom(null);
      return;
    }
    if (!card) {
      setToast(t.errors.noCard);
      return;
    }
    if (!p || p.type === 'K') return;
    if (card.kind === 'shield' && p.color === myColor) setPicks([s]);
    else if (card.kind === 'freeze' && p.color !== myColor) setPicks([s]);
    else if (card.kind === 'teleport' && p.color === myColor) {
      setPicks((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s].slice(-2)));
    }
  };

  const selectCard = (id: string) => {
    if (!myTurn || pending) return;
    setCardId(cardId === id ? null : id);
    setFrom(null);
    setDisguise(null);
    setPicks([]);
    play('pop');
  };

  const confirmEffect = () => {
    if (!card) return;
    if (card.kind === 'shield' || card.kind === 'freeze') send({ type: card.kind, cardId: card.id, square: picks[0] });
    else if (card.kind === 'teleport') send({ type: 'teleport', cardId: card.id, a: picks[0], b: picks[1] });
    else if (card.kind === 'reverse') send({ type: 'reverse', cardId: card.id });
  };

  // Texto de ayuda según la situación
  let hint = '';
  if (state.result) hint = '';
  else if (!myTurn) hint = fmt(t.rivalTurn, { name: state.names[state.turn] });
  else if (pending) hint = t.secondMove;
  else if (checked) hint = t.inCheck;
  else if (!card) hint = t.yourTurn;
  else if (isMoveCard(card)) {
    if (card.kind === 'wild' && from !== null && !disguise) hint = t.pickDisguise;
    else hint = from === null ? t.pickPiece : t.pickTarget;
  } else if (card.kind === 'shield') hint = t.pickOwn;
  else if (card.kind === 'freeze') hint = t.pickEnemy;
  else if (card.kind === 'teleport') hint = t.pickTwo;
  else if (card.kind === 'revive') hint = t.pickRevive;
  else hint = t.cards[card.kind][1];

  // Cartel grande del turno
  let banner: string;
  let bannerCls = 'mine';
  if (state.result) {
    banner = t.gameOverBanner;
    bannerCls = 'over';
  } else if (local) banner = fmt(t.turnOfBanner, { name: state.names[state.turn] });
  else if (state.turn === seat) banner = t.yourTurnBanner;
  else {
    banner = t.rivalTurnBanner;
    bannerCls = 'theirs';
  }

  const myCaptured = state.captured.filter((p) => p.color === myColor);
  const zone = card?.kind === 'number' && card.color !== 'black' && !checked ? card.color : null;
  const fromPiece = from !== null ? state.board[from] : null;
  const now = Date.now() + ctl.clockOffset;
  const hideHand = local && revealed !== state.turn && !state.result;

  const bar = (s: Seat, top: boolean) => {
    const color = state.seatColor[s];
    const lost = state.captured.filter((p) => p.color === color);
    const active = state.turn === s && !state.result;
    const left = timeLeft(state, s, now);
    return (
      <div className={`player-bar px ${active ? 'active' : ''}`}>
        <Avatar id={state.avatars[s]} size={44} />
        <div className="pinfo">
          <span className="pname">
            <PieceSprite type="K" color={color} className="mini" />
            {state.names[s]}
          </span>
          <span className="lost">
            {lost.map((p) => (
              <PieceSprite key={p.id} type={p.originType} color={p.color} className="tiny" />
            ))}
          </span>
        </div>
        {top && (
          <div className="opp-hand">
            {state.hands[s].map((c) => (
              <CardView key={c.id} small />
            ))}
          </div>
        )}
        {left !== null && <span className={`clock ${active ? 'running' : ''} ${left < 30_000 ? 'low' : ''}`}>{formatClock(left)}</span>}
        {ctl.emoji && ctl.emoji.seat === s && (
          <span key={ctl.emoji.n} className="emoji-pop">
            {ctl.emoji.e}
          </span>
        )}
      </div>
    );
  };

  const resultText = () => {
    const r = state.result!;
    if (r.winner === null) return t.draw;
    if (local) return fmt(t.winner, { name: state.names[r.winner] });
    return r.winner === seat ? t.youWin : t.youLose;
  };

  return (
    <div className="game">
      <header className="game-top">
        <button type="button" className="icon-btn px red" onClick={() => setConfirmResign(true)} aria-label={t.resign}>
          <Icon name="flag" />
        </button>
        <span className="brand-small">
          <span className="c-red">U</span>
          <span className="c-yellow">N</span>
          <span className="c-green">O</span>
          <span className="c-blue">Chess</span>
        </span>
        <div className="top-right">
          <button
            type="button"
            className="icon-btn px yellow"
            onClick={() => {
              setMusicEnabled(!music);
              setMusic(!music);
            }}
            aria-label={t.music}
          >
            <Icon name={music ? 'music' : 'musicOff'} color="#3b2a00" />
          </button>
          <button
            type="button"
            className="icon-btn px green"
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            aria-label={t.sound}
          >
            <Icon name={muted ? 'mute' : 'sound'} />
          </button>
          <button type="button" className="icon-btn px blue" onClick={() => setRules(true)} aria-label={t.howToPlay}>
            <Icon name="help" />
          </button>
        </div>
      </header>

      <div className={`turn-banner ${bannerCls}`} key={`${state.turnNumber}-${!!state.result}`}>
        {banner}
      </div>

      {ctl.status === 'disconnected' && (
        <div className="banner warn px">
          {ctl.viewSeat === 0 ? t.rivalLeft : t.disconnected}
          {ctl.viewSeat === 1 && (
            <button type="button" className="btn small" onClick={ctl.reconnect}>
              {t.reconnect}
            </button>
          )}
        </div>
      )}

      {bar(opp, true)}

      <div className="board-wrap">
        <Board
          board={state.board}
          bottom={myColor}
          selected={from !== null ? [from] : picks}
          targets={targets.map((m) => m.to)}
          lastMove={state.lastMove}
          zone={zone}
          frame={state.lastCard?.card.color ?? 'red'}
          shielded={shieldedIds(state)}
          frozen={new Set([...frozenIds(state, 0), ...frozenIds(state, 1)])}
          onSquare={onSquare}
        />
        {state.lastCard && (
          <div className="last-card" key={state.lastCard.card.id} title={t.lastCard}>
            <CardView card={state.lastCard.card} small />
          </div>
        )}
      </div>

      {bar(seat, false)}

      <div className={`hint ${checked && myTurn ? 'alert' : ''}`}>{hint}</div>

      <div className="actions">
        {myTurn && pending && (
          <button type="button" className="btn" onClick={() => send({ type: 'endTurn' })}>
            {t.endTurn}
          </button>
        )}
        {myTurn && card?.kind === 'wild' && fromPiece && fromPiece.type !== 'K' && (
          <div className="choices">
            {DISGUISES.map((d) => (
              <button
                type="button"
                key={d}
                className={`btn piece-btn ${disguise === d ? 'on' : ''}`}
                onClick={() => setDisguise(d)}
              >
                <PieceSprite type={d} color={myColor} />
              </button>
            ))}
          </div>
        )}
        {myTurn && card?.kind === 'revive' && (
          <div className="choices">
            {myCaptured.length === 0 && <span className="muted">{t.noCaptured}</span>}
            {myCaptured.map((p) => (
              <button
                type="button"
                key={p.id}
                className="btn piece-btn"
                title={state.board[p.origin] ? t.originBusy : ''}
                onClick={() => send({ type: 'revive', cardId: card.id, pieceId: p.id })}
              >
                <PieceSprite type={p.originType} color={p.color} />
                {state.board[p.origin] && <small>✗</small>}
              </button>
            ))}
          </div>
        )}
        {myTurn && card && (card.kind === 'reverse' || (picks.length > 0 && (card.kind !== 'teleport' || picks.length === 2))) && (
          <button type="button" className="btn primary" onClick={confirmEffect}>
            {card.kind === 'reverse' ? t.play : t.confirm}
          </button>
        )}
        {myTurn && card && !pending && !checked && (
          <button type="button" className="btn ghost" onClick={() => send({ type: 'discard', cardId: card.id })}>
            {t.discard}
          </button>
        )}
      </div>

      <div className="hand-panel px">
        <div className="hand">
          {hideHand ? (
            <button type="button" className="reveal" onClick={() => setRevealed(state.turn)}>
              <Avatar id={state.avatars[state.turn]} size={48} />
              <strong>{fmt(t.passDevice, { name: state.names[state.turn] })}</strong>
              <span>{t.tapToShow}</span>
            </button>
          ) : (
            hand.map((c) => (
              <CardView key={c.id} card={c} selected={c.id === cardId} disabled={!myTurn || !!pending} onClick={() => selectCard(c.id)} />
            ))
          )}
        </div>
        {!local && (
          <div className="emoji-bar">
            {EMOJIS.map((e) => (
              <button type="button" key={e} onClick={() => ctl.sendEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast px">{toast}</div>}

      {promo && (
        <div className="modal-bg" onClick={() => setPromo(null)}>
          <div className="modal px" onClick={(e) => e.stopPropagation()}>
            <h3>{t.promote}</h3>
            <div className="choices">
              {(['Q', 'R', 'B', 'N'] as PieceType[]).map((p) => (
                <button type="button" key={p} className="btn piece-btn" onClick={() => sendMove(promo, p)}>
                  <PieceSprite type={p} color={myColor} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmResign && (
        <div className="modal-bg" onClick={() => setConfirmResign(false)}>
          <div className="modal px" onClick={(e) => e.stopPropagation()}>
            <h3>{t.resignConfirm}</h3>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setConfirmResign(false)}>
                {t.cancel}
              </button>
              {!state.result && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    send({ type: 'resign' });
                    setConfirmResign(false);
                  }}
                >
                  {t.resign}
                </button>
              )}
              <button type="button" className="btn" onClick={onExit}>
                {t.exit}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.result && (
        <div className="modal-bg">
          <div className="modal px result">
            {state.result.winner !== null && <Avatar id={state.avatars[state.result.winner]} size={96} className="result-avatar" />}
            <h2>{resultText()}</h2>
            <p>{t.reasons[state.result.reason]}</p>
            <div className="row">
              <button type="button" className="btn primary" onClick={ctl.rematch}>
                {t.rematch}
              </button>
              <button type="button" className="btn ghost" onClick={onExit}>
                {t.exit}
              </button>
            </div>
          </div>
        </div>
      )}

      {rules && <Rules onClose={() => setRules(false)} />}
    </div>
  );
}
