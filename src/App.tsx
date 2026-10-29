import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ShapeTile } from './components/ShapeTile';
import {
  calculateScore,
  createDailyChallenge,
  createPracticeChallenge,
  createRunScore,
  getUtcDate,
  isValidDateKey,
  type DailyChallenge,
  type DifferenceMode,
  type RunScore,
} from './game/engine';
import {
  DEFAULT_DATA,
  readStoredData,
  saveCompletedRun,
  updatePreferences,
  writeStoredData,
  type StoredGameData,
} from './game/storage';
import { t, type Language, type MessageKey } from './game/i18n';

 type Screen = 'home' | 'game' | 'result';
 type GameMode = 'daily' | 'practice';
 type Feedback = 'correct' | 'wrong' | 'timeout' | null;

function modeKey(mode: DifferenceMode): MessageKey {
  return mode;
}

function formatTime(seconds: number, language: Language) {
  const value = Math.max(0, seconds);
  return language === 'ar' ? `${value.toLocaleString('ar')} ث` : `${value.toFixed(1)}s`;
}

function safeStorageData(): StoredGameData {
  try { return readStoredData(); }
  catch { return { ...DEFAULT_DATA, preferences: { ...DEFAULT_DATA.preferences } }; }
}

function Icon({ name, size = 18 }: { name: 'spark' | 'volume' | 'mute' | 'globe' | 'arrow' | 'share' | 'copy' | 'download' | 'fire' | 'trophy' | 'clock' | 'check' | 'close' | 'play' | 'back' | 'install'; size?: number }) {
  const paths: Record<typeof name, ReactNode> = {
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></>,
    mute: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 17v3h14v-3"/></>,
    fire: <><path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 3-2 3 0-4-3-7-5-8 1 5-4 7-4 13 0 3 3 6 8 6Z"/><path d="M12 22c-2 0-3-2-3-4 0-1 1-3 2-4 0 2 3 2 3 5 0 2-1 3-2 3Z"/></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    play: <path d="m8 5 12 7-12 7V5Z"/>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></>,
    install: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 7v8m-3-3 3 3 3-3M9 17h6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const initialDate = useMemo(() => {
    const requested = new URLSearchParams(window.location.search).get('day');
    return isValidDateKey(requested) ? requested : getUtcDate();
  }, []);
  const [data, setData] = useState<StoredGameData>(() => safeStorageData());
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<GameMode>('daily');
  const [challengeDate, setChallengeDate] = useState(initialDate);
  const [challenge, setChallenge] = useState<DailyChallenge>(() => createDailyChallenge(initialDate));
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [lastWrongIndex, setLastWrongIndex] = useState(-1);
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(12);
  const [startedAt, setStartedAt] = useState(0);
  const [result, setResult] = useState<RunScore | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [toast, setToast] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showRules, setShowRules] = useState(false);
  const resolvedRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutHandlerRef = useRef<() => void>(() => undefined);
  const language = data.preferences.language;
  const isArabic = language === 'ar';
  const challengeRound = challenge.rounds[roundIndex];
  const isDaily = mode === 'daily';

  const msg = useCallback((key: MessageKey) => t(language, key), [language]);

  const patchData = useCallback((next: StoredGameData) => {
    setData(next);
    writeStoredData(next);
  }, []);

  const playTone = useCallback((success: boolean) => {
    if (!data.preferences.sound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = success ? 700 : 210;
      gain.gain.setValueAtTime(0.07, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
      oscillator.onended = () => { void context.close(); };
    } catch {
      // Audio is an optional enhancement; blocked audio never interrupts play.
    }
  }, [data.preferences.sound]);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  }, [language, isArabic]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const finishRun = useCallback((finalCorrect: number, finalMistakes: number) => {
    const finalScore = createRunScore(finalCorrect, finalMistakes, Date.now() - startedAt);
    setResult(finalScore);
    setScreen('result');
    setDeadline(0);
    setFeedback(null);
    resolvedRef.current = true;
    const previousBest = data.personalBest;
    const newBest = mode === 'daily' && (!previousBest || finalScore.score > previousBest.score ||
      (finalScore.score === previousBest.score && finalScore.elapsedSeconds < previousBest.elapsedSeconds));
    setIsNewBest(newBest);
    const nextData = saveCompletedRun(data, finalScore, mode, mode === 'daily' ? challengeDate : getUtcDate());
    patchData(nextData);
  }, [startedAt, data, mode, challengeDate, patchData]);

  const advance = useCallback((nextCorrect: number, nextMistakes: number, nextIndex = roundIndex + 1) => {
    if (nextIndex >= challenge.rounds.length) {
      finishRun(nextCorrect, nextMistakes);
      return;
    }
    setCorrect(nextCorrect);
    setMistakes(nextMistakes);
    setRoundIndex(nextIndex);
    setFeedback(null);
    setFeedbackText('');
    resolvedRef.current = false;
    const newDeadline = Date.now() + challenge.rounds[nextIndex]!.seconds * 1000;
    setDeadline(newDeadline);
    setRemaining(challenge.rounds[nextIndex]!.seconds);
  }, [roundIndex, challenge.rounds, finishRun]);

  const handleTimeout = useCallback(() => {
    if (screen !== 'game' || resolvedRef.current) return;
    resolvedRef.current = true;
    setFeedback('timeout');
    setFeedbackText(msg('timeUp'));
    playTone(false);
    setDeadline(0);
    advanceTimerRef.current = setTimeout(() => advance(correct, mistakes + 1), 450);
  }, [screen, msg, playTone, advance, correct, mistakes]);
  timeoutHandlerRef.current = handleTimeout;

  useEffect(() => {
    if (screen !== 'game' || deadline <= 0) return;
    const tick = () => {
      const secondsLeft = Math.max(0, (deadline - Date.now()) / 1000);
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) timeoutHandlerRef.current();
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [screen, deadline]);

  const startGame = useCallback((nextMode: GameMode) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const date = getUtcDate();
    let nextChallenge: DailyChallenge;
    let nextDate = date;
    if (nextMode === 'daily') {
      // Shared historical links keep their requested date until the player
      // explicitly selects today's challenge; every date is reproducible.
      nextDate = challengeDate;
      nextChallenge = createDailyChallenge(nextDate);
    } else {
      nextChallenge = createPracticeChallenge(Date.now());
    }
    setChallenge(nextChallenge);
    setChallengeDate(nextDate);
    setMode(nextMode);
    setRoundIndex(0);
    setCorrect(0);
    setMistakes(0);
    setFeedback(null);
    setFeedbackText('');
    setResult(null);
    setStartedAt(Date.now());
    setRemaining(nextChallenge.rounds[0]!.seconds);
    setDeadline(Date.now() + nextChallenge.rounds[0]!.seconds * 1000);
    resolvedRef.current = false;
    setScreen('game');
    setToast('');
  }, [challengeDate]);

  const handleSelect = useCallback((index: number) => {
    if (screen !== 'game' || resolvedRef.current) return;
    if (deadline > 0 && Date.now() >= deadline) { timeoutHandlerRef.current(); return; }
    if (index !== challengeRound?.oddIndex) {
      setMistakes((current) => current + 1);
      setFeedback('wrong');
      setFeedbackText(msg('incorrect'));
      playTone(false);
      window.setTimeout(() => setFeedback((current) => current === 'wrong' ? null : current), 420);
      return;
    }
    resolvedRef.current = true;
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    setFeedback('correct');
    setFeedbackText(msg('correct'));
    playTone(true);
    setDeadline(0);
    advanceTimerRef.current = setTimeout(() => advance(nextCorrect, mistakes), 500);
  }, [screen, deadline, challengeRound, msg, playTone, correct, mistakes, advance]);

  const shareChallengeUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('day', challengeDate);
    return url.toString();
  }, [challengeDate]);

  const copyText = useCallback(async (text: string, successMessage = msg('copied')) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) {
        setToast(msg('shareError'));
        return;
      }
    }
    setToast(successMessage);
  }, [msg]);

  const shareChallenge = useCallback(async () => {
    const url = shareChallengeUrl();
    const shareData = { title: 'Odd One Out Daily', text: `Can you spot the odd one out? Play the same daily puzzle:`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    await copyText(url);
  }, [shareChallengeUrl, copyText]);

  const resultText = useMemo(() => {
    if (!result) return '';
    const dateLine = mode === 'daily' ? `${challengeDate} · Daily challenge` : 'Practice mode';
    const marks = Array.from({ length: 5 }, (_, i) => i < result.correct ? '🟪' : '⬜').join('');
    return `Odd One Out Daily\n${dateLine}\n${marks}\nScore: ${result.score} · Time: ${formatTime(result.elapsedSeconds, 'en')}\nCan you beat me? ${shareChallengeUrl()}`;
  }, [result, mode, challengeDate, shareChallengeUrl]);

  const shareResult = useCallback(async () => {
    if (!result) return;
    const image = createResultCardSvg(result, challengeDate, mode);
    const file = new File([image], 'odd-one-out-result.svg', { type: 'image/svg+xml' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'Odd One Out Daily result', text: resultText, files: [file] });
        return;
      } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    if (navigator.share) {
      try { await navigator.share({ title: 'Odd One Out Daily', text: resultText, url: shareChallengeUrl() }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    await copyText(resultText);
  }, [result, challengeDate, mode, resultText, shareChallengeUrl, copyText]);

  const downloadResultCard = useCallback(() => {
    if (!result) return;
    const blob = new Blob([createResultCardSvg(result, challengeDate, mode)], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `odd-one-out-${challengeDate}-result.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, [result, challengeDate, mode]);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const setLanguage = useCallback((next: Language) => {
    patchData(updatePreferences(data, { language: next }));
  }, [data, patchData]);

  const toggleSound = useCallback(() => {
    patchData(updatePreferences(data, { sound: !data.preferences.sound }));
  }, [data, patchData]);

  const returnHome = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setDeadline(0);
    setScreen('home');
    setFeedback(null);
    setResult(null);
  }, []);

  const timerStyle = { '--timer-progress': `${Math.max(0, Math.min(100, remaining / (challengeRound?.seconds || 12) * 100))}%` } as CSSProperties;

  return (
    <div className={`app-shell ${isArabic ? 'rtl' : ''}`}>
      <header className="topbar">
        <button className="brand-mark" type="button" aria-label="Odd One Out Daily home" onClick={returnHome}>
          <span className="brand-icons" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-copy"><strong>odd one out</strong><small>DAILY PUZZLE CLUB</small></span>
        </button>
        <div className="topbar-actions">
          <button className={`icon-button ${data.preferences.sound ? 'is-on' : ''}`} type="button" onClick={toggleSound} aria-label={`${msg('sound')}: ${data.preferences.sound ? 'on' : 'off'}`} title={msg('sound')}>
            <Icon name={data.preferences.sound ? 'volume' : 'mute'} />
          </button>
          <button className="language-button" type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} aria-label={msg('language')}>
            <Icon name="globe" size={16} /><span>{isArabic ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      <main className="main-content" key={screen}>
        {screen === 'home' && (
          <section className="home-layout" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" />{msg('eyebrow')}</div>
              <h1 id="hero-title">{msg('titleA')}<br /><span>{msg('titleB')}</span></h1>
              <p className="hero-subtitle">{msg('subtitle')}</p>
              <div className="hero-meta"><span className="live-pulse" />{msg('dailyTag')}<span className="meta-divider">·</span><span>{challengeDate}</span></div>
              <div className="home-cta-row">
                <button className="primary-button" type="button" onClick={() => startGame('daily')}>
                  <span>{msg('playDaily')}</span><Icon name="arrow" size={19} />
                </button>
                <button className="secondary-button" type="button" onClick={() => startGame('practice')}>
                  <Icon name="play" size={16} /><span>{msg('practice')}</span>
                </button>
              </div>
              <div className="hero-footnote"><Icon name="spark" size={15} /> <span>{msg('localData')}</span></div>
            </div>

            <div className="hero-art" aria-label="Colorful shapes puzzle preview">
              <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
              <div className="art-chip chip-top">01 <span>·</span> 05</div>
              <div className="art-shape shape-purple"><svg viewBox="0 0 100 100"><path d="M50 8 92 50 50 92 8 50Z" fill="currentColor"/><circle cx="50" cy="50" r="12" fill="#fff"/></svg></div>
              <div className="art-shape shape-coral"><svg viewBox="0 0 100 100"><path d="M50 9 94 88H6Z" fill="currentColor"/></svg></div>
              <div className="art-shape shape-yellow"><svg viewBox="0 0 100 100"><path d="M50 5 61 35 94 32 72 53 85 84 55 69 31 94 35 62 5 48 37 42Z" fill="currentColor"/></svg></div>
              <div className="art-shape shape-green"><svg viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="72" rx="22" fill="currentColor"/><path d="m35 49 10 10 22-23" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div className="art-shape shape-blue"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="39" fill="currentColor"/><circle cx="50" cy="50" r="13" fill="#fff"/></svg></div>
              <div className="art-note"><span>?</span><div><strong>Spot it.</strong><small>Trust your eyes.</small></div></div>
              <div className="art-sparkle sparkle-one">✳</div><div className="art-sparkle sparkle-two">✦</div>
            </div>

            <div className="stats-strip">
              <div className="stat-card"><span className="stat-icon streak-icon"><Icon name="fire" size={18} /></span><div><strong>{data.streak}</strong><small>{msg('streak')}</small></div></div>
              <div className="stat-separator" />
              <div className="stat-card"><span className="stat-icon best-icon"><Icon name="trophy" size={18} /></span><div><strong>{data.personalBest?.score ?? '—'}</strong><small>{msg('best')}</small></div></div>
              <div className="stat-separator" />
              <button className="stat-card rules-stat" type="button" onClick={() => setShowRules((value) => !value)}><span className="stat-icon rules-icon">?</span><div><strong>{msg('rulesTitle')}</strong><small>{msg('roundHint')}</small></div></button>
            </div>
            {showRules && <div className="rules-panel"><strong>{msg('rulesTitle')}</strong><p>{msg('rulesBody')}</p><button type="button" onClick={() => setShowRules(false)} aria-label={msg('close')}><Icon name="close" size={16} /></button></div>}

            <section className="history-section" aria-labelledby="history-title">
              <div className="section-heading"><h2 id="history-title">{msg('history')}</h2><span>{data.history.length} / 100</span></div>
              {data.history.length > 0 ? <div className="history-list">{data.history.slice(0, 3).map((entry) => <div className="history-row" key={`${entry.finishedAt}-${entry.mode}`}><span className={`history-mode ${entry.mode}`}>{entry.mode === 'daily' ? msg('modeDaily') : msg('modePractice')}</span><span className="history-date">{entry.date}</span><strong>{entry.score} <small>pts</small></strong><span className="history-time"><Icon name="clock" size={13} />{formatTime(entry.elapsedSeconds, language)}</span></div>)}</div> : <div className="history-empty"><span aria-hidden="true">✦</span><p>{msg('noHistory')}</p></div>}
            </section>
            {installPrompt && <button className="install-banner" type="button" onClick={() => void installApp()}><Icon name="install" /><span><strong>{msg('install')}</strong><small>{msg('installHint')}</small></span><Icon name="arrow" /></button>}
          </section>
        )}

        {screen === 'game' && challengeRound && (
          <section className="game-layout" aria-labelledby="game-title">
            <div className="game-topline">
              <button className="back-button" type="button" onClick={returnHome}><Icon name="back" size={18} /><span>{msg('back')}</span></button>
              <span className={`mode-pill ${mode}`}>{isDaily ? msg('modeDaily') : msg('modePractice')}</span>
              {isDaily && <button className="share-small" type="button" onClick={() => void shareChallenge()} aria-label={msg('shareDaily')}><Icon name="share" size={17} /></button>}
            </div>
            <div className="round-heading">
              <div className="round-overline">{msg('round')} <strong>{String(roundIndex + 1).padStart(2, '0')}</strong> <span>{msg('of')} 05</span></div>
              <h1 id="game-title">{msg('find')}</h1>
              <p>{msg(modeKey(challengeRound.mode))}</p>
            </div>
            <div className="round-progress" aria-label={`Round ${roundIndex + 1} of 5`}>
              {challenge.rounds.map((round, i) => <span key={round.index} className={`${i < roundIndex ? 'complete' : ''} ${i === roundIndex ? 'active' : ''}`} />)}
            </div>
            <div className="game-board-wrap">
              <div className="timer-row"><span className="timer-label"><Icon name="clock" size={16} />{msg('seconds')}</span><strong className={remaining <= 3 ? 'timer-urgent' : ''}>{Math.ceil(remaining).toLocaleString(language === 'ar' ? 'ar' : 'en-US')}<small>s</small></strong></div>
              <div className="timer-track" style={timerStyle}><span /></div>
              <div className={`puzzle-grid grid-${challengeRound.columns} ${feedback === 'wrong' ? 'board-wiggle' : ''}`} style={{ '--grid-columns': challengeRound.columns } as CSSProperties}>
                {challengeRound.tiles.map((tile, index) => (
                  <ShapeTile
                    key={`${challengeRound.index}-${tile.id}`}
                    tile={tile}
                    shape={challengeRound.shape}
                    round={challengeRound}
                    index={index}
                    disabled={resolvedRef.current || feedback === 'timeout' || (feedback === 'correct' && index !== challengeRound.oddIndex)}
                    status={feedback === 'correct' && index === challengeRound.oddIndex ? 'correct' : feedback === 'wrong' && index === lastWrongIndex ? 'wrong' : 'idle'}
                    onSelect={(tileIndex) => { setLastWrongIndex(tileIndex); handleSelect(tileIndex); }}
                    label={`${msg('round')} ${roundIndex + 1}, shape ${index + 1}`}
                  />
                ))}
              </div>
              <div className={`feedback-message ${feedback || ''}`} role="status" aria-live="polite">{feedbackText || msg('roundHint')}</div>
            </div>
            <div className="game-footer-stats"><div><span>{msg('accuracy')}</span><strong>{correct} / 5</strong></div><div><span>{msg('mistakes')}</span><strong>{mistakes}</strong></div><div><span>{msg('score')}</span><strong>{calculateScore(correct, mistakes)}</strong></div></div>
          </section>
        )}

        {screen === 'result' && result && (
          <section className="result-layout" aria-labelledby="result-title">
            <div className="result-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="result-icon"><Icon name="trophy" size={31} /></div>
            <div className="eyebrow result-eyebrow"><span className="eyebrow-dot" />{msg('result')}</div>
            <h1 id="result-title">{msg('dailyComplete')}</h1>
            <p className="result-subtitle">{msg('resultSubtitle')}</p>
            {isNewBest && <div className="new-best-chip"><Icon name="spark" size={16} />{msg('bestNew')}</div>}
            <div className="result-score-card">
              <div className="score-label">{msg('score')}</div>
              <div className="score-value">{result.score.toLocaleString(language === 'ar' ? 'ar' : 'en-US')}</div>
              <div className="score-subline"><span>{isDaily ? challengeDate : msg('practiceMode')}</span><span className="score-subdot">·</span><span>{result.correct}/5 {msg('accuracy')}</span></div>
              <div className="result-metrics">
                <div><span className="metric-symbol found-symbol"><Icon name="check" size={16} /></span><small>{msg('accuracy')}</small><strong>{result.correct}/5</strong></div>
                <div><span className="metric-symbol error-symbol"><Icon name="close" size={16} /></span><small>{msg('mistakes')}</small><strong>{result.mistakes}</strong></div>
                <div><span className="metric-symbol time-symbol"><Icon name="clock" size={16} /></span><small>{msg('time')}</small><strong>{formatTime(result.elapsedSeconds, language)}</strong></div>
              </div>
              <div className="result-marks" aria-label={`${result.correct} correct out of 5`}>{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < result.correct ? 'mark-found' : 'mark-missed'}>{i < result.correct ? '✦' : '·'}</span>)}</div>
            </div>
            {data.personalBest && <div className="personal-best-line"><Icon name="trophy" size={16} /><span>{msg('best')}: <strong>{data.personalBest.score}</strong></span><span className="best-divider">·</span><span>{formatTime(data.personalBest.elapsedSeconds, language)}</span></div>}
            <div className="result-actions">
              <button className="primary-button" type="button" onClick={() => void shareResult()}><Icon name="share" size={18} /><span>{msg('share')}</span></button>
              <button className="secondary-button" type="button" onClick={downloadResultCard}><Icon name="download" size={17} /><span>{msg('downloadCard')}</span></button>
            </div>
            <div className="result-secondary-actions"><button type="button" onClick={() => void shareChallenge()}><Icon name="copy" size={15} />{msg('shareDaily')}</button><button type="button" onClick={returnHome}>{msg('back')}</button></div>
            <div className="result-footer-note"><span className="live-pulse" />{msg('localData')}</div>
          </section>
        )}
      </main>

      <footer className="page-footer"><span>© {new Date().getUTCFullYear()} odd one out daily</span><span className="footer-dot">·</span><span>5 rounds, one little twist.</span></footer>
      {toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}
    </div>
  );
}

function createResultCardSvg(result: RunScore, date: string, mode: GameMode): string {
  const marks = Array.from({ length: 5 }, (_, i) => {
    const x = 96 + i * 74;
    const fill = i < result.correct ? '#6C63FF' : '#E9E7F2';
    return `<rect x="${x}" y="302" width="54" height="54" rx="16" fill="${fill}"/><text x="${x + 27}" y="337" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="${i < result.correct ? '#FFFFFF' : '#9E9AAE'}">${i < result.correct ? '✦' : '·'}</text>`;
  }).join('');
  const dateText = escapeXml(mode === 'daily' ? date : 'Practice mode');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="520" viewBox="0 0 600 520"><rect width="600" height="520" rx="34" fill="#F7F6F2"/><circle cx="536" cy="62" r="94" fill="#ECEAFF"/><circle cx="48" cy="448" r="108" fill="#FCE8E9"/><rect x="38" y="38" width="524" height="444" rx="28" fill="#FFFFFF"/><text x="68" y="91" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="2" fill="#716B90">ODD ONE OUT DAILY</text><text x="68" y="150" font-family="Arial,sans-serif" font-size="40" font-weight="800" fill="#24223B">I SPOTTED</text><text x="68" y="194" font-family="Arial,sans-serif" font-size="40" font-weight="800" fill="#6C63FF">THE ODD ONE.</text><text x="68" y="232" font-family="Arial,sans-serif" font-size="16" fill="#77738B">${dateText}</text><text x="68" y="276" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="#918DA3">MY SCORE</text><text x="68" y="340" font-family="Arial,sans-serif" font-size="60" font-weight="800" fill="#25233E">${result.score}</text>${marks}<text x="68" y="414" font-family="Arial,sans-serif" font-size="15" fill="#6F6B83">${result.correct}/5 found  ·  ${result.mistakes} mistakes  ·  ${result.elapsedSeconds.toFixed(1)}s</text><text x="68" y="452" font-family="Arial,sans-serif" font-size="13" fill="#9995A9">Can you beat me? Play tomorrow's puzzle, too.</text></svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
