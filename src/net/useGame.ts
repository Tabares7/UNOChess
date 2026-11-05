import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { GameError, applyAction, newGame, otherSeat, timeLeft } from '../engine/game';
import type { Action, GameState, Seat } from '../engine/types';

const PEER_PREFIX = 'unochess-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

type Msg =
  | { t: 'hello'; name: string }
  | { t: 'state'; state: GameState; seat: Seat; hostNow: number }
  | { t: 'action'; action: Action }
  | { t: 'error'; key: string }
  | { t: 'emoji'; e: string }
  | { t: 'rematch' };

export type Status = 'waiting' | 'connecting' | 'playing' | 'disconnected' | 'error';

export interface EmojiEvent {
  e: string;
  seat: Seat;
  n: number;
}

export interface Controller {
  mode: 'local' | 'online';
  state: GameState | null;
  /** Asiento desde cuyo punto de vista se ve la partida */
  viewSeat: Seat;
  status: Status;
  code?: string;
  /** Diferencia entre el reloj del anfitrión y el local */
  clockOffset: number;
  emoji: EmojiEvent | null;
  /** Devuelve la clave del error o null si la acción se aceptó */
  act: (action: Action) => string | null;
  sendEmoji: (e: string) => void;
  rematch: () => void;
  reconnect: () => void;
}

function tryApply(state: GameState, seat: Seat, action: Action): GameState | string {
  try {
    return applyAction(state, seat, action);
  } catch (e) {
    if (e instanceof GameError) return e.key;
    throw e;
  }
}

/** Revisa periódicamente si al jugador en turno se le acabó el tiempo */
function useTimeoutWatcher(state: GameState | null, onTimeout: () => void, enabled: boolean) {
  const cb = useRef(onTimeout);
  cb.current = onTimeout;
  useEffect(() => {
    if (!enabled || !state?.clock || state.result) return;
    const id = setInterval(() => {
      const left = timeLeft(state, state.turn, Date.now());
      if (left !== null && left <= 0) cb.current();
    }, 300);
    return () => clearInterval(id);
  }, [state, enabled]);
}

export function useLocalGame(names: [string, string], minutes: number | null): Controller {
  const [state, setState] = useState(() => newGame({ names, minutes }));
  const [whiteSeat, setWhiteSeat] = useState<Seat>(0);

  const act = useCallback(
    (action: Action) => {
      const res = tryApply(state, state.turn, action);
      if (typeof res === 'string') return res;
      setState(res);
      return null;
    },
    [state],
  );

  useTimeoutWatcher(state, () => act({ type: 'timeout' }), true);

  return {
    mode: 'local',
    state,
    viewSeat: state.turn,
    status: 'playing',
    clockOffset: 0,
    emoji: null,
    act,
    sendEmoji: () => {},
    rematch: () => {
      const ws = otherSeat(whiteSeat);
      setWhiteSeat(ws);
      setState(newGame({ names, minutes, whiteSeat: ws }));
    },
    reconnect: () => {},
  };
}

/** El anfitrión guarda el estado autoritativo y lo envía al invitado. */
export function useHostGame(name: string, minutes: number | null): Controller {
  const [code, setCode] = useState(makeCode);
  const [state, setState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const [emoji, setEmoji] = useState<EmojiEvent | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const whiteRef = useRef<Seat>(Math.random() < 0.5 ? 0 : 1);

  const publish = useCallback((s: GameState) => {
    stateRef.current = s;
    setState(s);
    connRef.current?.send({ t: 'state', state: s, seat: 1, hostNow: Date.now() } satisfies Msg);
  }, []);

  const apply = useCallback(
    (seat: Seat, action: Action) => {
      const s = stateRef.current;
      if (!s) return 'gameOver';
      const res = tryApply(s, seat, action);
      if (typeof res === 'string') return res;
      publish(res);
      return null;
    },
    [publish],
  );

  useEffect(() => {
    const peer = new Peer(PEER_PREFIX + code);
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') setCode(makeCode());
      else if (err.type !== 'peer-unavailable') setStatus('error');
    });
    peer.on('connection', (conn) => {
      if (connRef.current?.open) {
        conn.on('open', () => conn.close());
        return;
      }
      connRef.current = conn;
      conn.on('data', (raw) => {
        const msg = raw as Msg;
        if (msg.t === 'hello') {
          if (!stateRef.current) {
            let guestName = msg.name.slice(0, 20) || '?';
            if (guestName === name) guestName += ' 2';
            publish(newGame({ names: [name, guestName], minutes, whiteSeat: whiteRef.current }));
          } else {
            publish(stateRef.current);
          }
          setStatus('playing');
        } else if (msg.t === 'action') {
          const err = apply(1, msg.action);
          if (err) conn.send({ t: 'error', key: err } satisfies Msg);
        } else if (msg.t === 'emoji') {
          setEmoji((prev) => ({ e: msg.e, seat: 1, n: (prev?.n ?? 0) + 1 }));
        } else if (msg.t === 'rematch') {
          rematchRef.current();
        }
      });
      conn.on('close', () => {
        if (connRef.current === conn) {
          connRef.current = null;
          setStatus(stateRef.current ? 'disconnected' : 'waiting');
        }
      });
    });
    return () => peer.destroy();
    // `name`/`minutes` no cambian durante la sesión
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const rematch = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    whiteRef.current = otherSeat(whiteRef.current);
    publish(newGame({ names: s.names, minutes, whiteSeat: whiteRef.current }));
  }, [minutes, publish]);
  const rematchRef = useRef(rematch);
  rematchRef.current = rematch;

  useTimeoutWatcher(state, () => apply(state!.turn, { type: 'timeout' }), true);

  return {
    mode: 'online',
    state,
    viewSeat: 0,
    status,
    code,
    clockOffset: 0,
    emoji,
    act: (action) => apply(0, action),
    sendEmoji: (e) => {
      connRef.current?.send({ t: 'emoji', e } satisfies Msg);
      setEmoji((prev) => ({ e, seat: 0, n: (prev?.n ?? 0) + 1 }));
    },
    rematch,
    reconnect: () => {},
  };
}

export function useGuestGame(name: string, code: string, onError: (key: string) => void): Controller {
  const [state, setState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [emoji, setEmoji] = useState<EmojiEvent | null>(null);
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const connRef = useRef<DataConnection | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    setStatus('connecting');
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code.toUpperCase(), { reliable: true });
      connRef.current = conn;
      conn.on('open', () => conn.send({ t: 'hello', name } satisfies Msg));
      conn.on('data', (raw) => {
        const msg = raw as Msg;
        if (msg.t === 'state') {
          setOffset(msg.hostNow - Date.now());
          setState(msg.state);
          setStatus('playing');
        } else if (msg.t === 'error') {
          onErrorRef.current(msg.key);
        } else if (msg.t === 'emoji') {
          setEmoji((prev) => ({ e: msg.e, seat: 0, n: (prev?.n ?? 0) + 1 }));
        }
      });
      conn.on('close', () => setStatus('disconnected'));
    });
    peer.on('error', (err) => {
      setStatus(err.type === 'peer-unavailable' ? 'error' : 'disconnected');
    });
    return () => peer.destroy();
  }, [code, name, attempt]);

  return {
    mode: 'online',
    state,
    viewSeat: 1,
    status,
    code,
    clockOffset: offset,
    emoji,
    act: (action) => {
      if (!state) return 'gameOver';
      // Validación local para responder al instante; el anfitrión decide
      const res = tryApply(state, 1, action);
      if (typeof res === 'string') return res;
      connRef.current?.send({ t: 'action', action } satisfies Msg);
      return null;
    },
    sendEmoji: (e) => {
      connRef.current?.send({ t: 'emoji', e } satisfies Msg);
      setEmoji((prev) => ({ e, seat: 1, n: (prev?.n ?? 0) + 1 }));
    },
    rematch: () => connRef.current?.send({ t: 'rematch' } satisfies Msg),
    reconnect: () => setAttempt((a) => a + 1),
  };
}
