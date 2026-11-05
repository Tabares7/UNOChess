import { useEffect, useState } from 'react';
import { CardView } from './components/CardView';
import { GameScreen } from './components/GameScreen';
import { Rules } from './components/Rules';
import { I18nContext, dictionaries, useT, type Lang } from './i18n';
import { useGuestGame, useHostGame, useLocalGame, type Controller } from './net/useGame';

type Screen =
  | { kind: 'home' }
  | { kind: 'local'; names: [string, string]; minutes: number | null }
  | { kind: 'host'; name: string; minutes: number | null }
  | { kind: 'guest'; name: string; code: string };

const TIMES = [null, 3, 5, 10, 15, 30];

function load(key: string, fallback: string) {
  try {
    return localStorage.getItem(`unochess.${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(`unochess.${key}`, value);
  } catch {
    /* sin almacenamiento */
  }
}

const roomFromUrl = () => new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '';

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (load('lang', 'es') as Lang));
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });

  useEffect(() => {
    save('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const exit = () => {
    history.replaceState(null, '', location.pathname);
    setScreen({ kind: 'home' });
  };

  return (
    <I18nContext.Provider value={dictionaries[lang]}>
      <div className="app">
        {screen.kind === 'home' && <Home lang={lang} setLang={setLang} onStart={setScreen} />}
        {screen.kind === 'local' && <LocalGame names={screen.names} minutes={screen.minutes} onExit={exit} />}
        {screen.kind === 'host' && <HostGame name={screen.name} minutes={screen.minutes} onExit={exit} />}
        {screen.kind === 'guest' && <GuestGame name={screen.name} code={screen.code} onExit={exit} />}
      </div>
    </I18nContext.Provider>
  );
}

function Home({ lang, setLang, onStart }: { lang: Lang; setLang: (l: Lang) => void; onStart: (s: Screen) => void }) {
  const t = useT();
  const [name, setName] = useState(() => load('name', ''));
  const [minutes, setMinutes] = useState<number | null>(() => {
    const v = load('minutes', '10');
    return v === 'null' ? null : Number(v);
  });
  const [code, setCode] = useState(roomFromUrl);
  const [rules, setRules] = useState(false);
  const [installEvt, setInstallEvt] = useState<(Event & { prompt: () => void }) | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as Event & { prompt: () => void });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const myName = name.trim() || t.player1;
  const remember = () => {
    save('name', name.trim());
    save('minutes', String(minutes));
  };

  return (
    <div className="home">
      <div className="lang">
        {(['es', 'en'] as Lang[]).map((l) => (
          <button type="button" key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="logo-cards">
        <CardView card={{ id: 'l1', kind: 'number', color: 'red', value: 7 }} small />
        <span className="logo-king">♚&#xFE0E;</span>
        <CardView card={{ id: 'l2', kind: 'plus2', color: 'blue' }} small />
      </div>
      <h1 className="logo">
        <span className="c-red">U</span>
        <span className="c-yellow">N</span>
        <span className="c-green">O</span>
        <span className="c-blue">Chess</span>
      </h1>
      <p className="tagline">{t.tagline}</p>

      <label className="field">
        <span>{t.yourName}</span>
        <input value={name} maxLength={20} placeholder={t.player1} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span>{t.time}</span>
        <select value={String(minutes)} onChange={(e) => setMinutes(e.target.value === 'null' ? null : Number(e.target.value))}>
          {TIMES.map((m) => (
            <option key={String(m)} value={String(m)}>
              {m === null ? t.noLimit : `${m} ${t.minutes}`}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn primary big"
        onClick={() => {
          remember();
          onStart({ kind: 'local', names: [myName, t.player2], minutes });
        }}
      >
        📱 {t.playLocal}
      </button>
      <button
        type="button"
        className="btn big"
        onClick={() => {
          remember();
          onStart({ kind: 'host', name: myName, minutes });
        }}
      >
        🌐 {t.createRoom}
      </button>
      <div className="join">
        <input
          value={code}
          maxLength={5}
          placeholder={t.roomCode}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        />
        <button
          type="button"
          className="btn"
          disabled={code.length !== 5}
          onClick={() => {
            remember();
            onStart({ kind: 'guest', name: myName, code });
          }}
        >
          {t.joinRoom}
        </button>
      </div>

      <div className="home-links">
        <button type="button" className="link" onClick={() => setRules(true)}>
          ❔ {t.howToPlay}
        </button>
        {installEvt && (
          <button type="button" className="link" onClick={() => installEvt.prompt()}>
            ⬇️ {t.install}
          </button>
        )}
      </div>
      {rules && <Rules onClose={() => setRules(false)} />}
    </div>
  );
}

function LocalGame({ names, minutes, onExit }: { names: [string, string]; minutes: number | null; onExit: () => void }) {
  const ctl = useLocalGame(names, minutes);
  return <GameScreen ctl={ctl} onExit={onExit} />;
}

function HostGame({ name, minutes, onExit }: { name: string; minutes: number | null; onExit: () => void }) {
  const ctl = useHostGame(name, minutes);
  if (!ctl.state) return <Lobby ctl={ctl} onExit={onExit} />;
  return <GameScreen ctl={ctl} onExit={onExit} />;
}

function GuestGame({ name, code, onExit }: { name: string; code: string; onExit: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const ctl = useGuestGame(name, code, setErr);
  const t = useT();
  useEffect(() => {
    if (!err) return;
    const id = setTimeout(() => setErr(null), 2000);
    return () => clearTimeout(id);
  }, [err]);
  if (!ctl.state) return <Lobby ctl={ctl} onExit={onExit} />;
  return (
    <>
      <GameScreen ctl={ctl} onExit={onExit} />
      {err && <div className="toast">{t.errors[err] ?? err}</div>}
    </>
  );
}

function Lobby({ ctl, onExit }: { ctl: Controller; onExit: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}${location.pathname}?room=${ctl.code}`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'UNOChess', text: `UNOChess: ${ctl.code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      }
    } catch {
      /* el usuario canceló */
    }
  };
  const isHost = ctl.viewSeat === 0;
  return (
    <div className="home lobby">
      <h2>{isHost ? t.waitingRival : ctl.status === 'error' ? t.connError : t.connecting}</h2>
      {isHost && (
        <>
          <p>{t.shareCode}</p>
          <div className="code">{ctl.code}</div>
          <button type="button" className="btn primary big" onClick={share}>
            🔗 {copied ? t.copied : t.share}
          </button>
        </>
      )}
      {!isHost && ctl.status !== 'error' && <div className="spinner" />}
      {!isHost && (ctl.status === 'error' || ctl.status === 'disconnected') && (
        <button type="button" className="btn" onClick={ctl.reconnect}>
          {t.reconnect}
        </button>
      )}
      <button type="button" className="btn ghost" onClick={onExit}>
        {t.cancel}
      </button>
    </div>
  );
}
