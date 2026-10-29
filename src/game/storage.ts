import type { GameHistoryEntry, RunScore } from './engine';

const STORAGE_KEY = 'odd-one-out-daily:v1';

export interface AppPreferences {
  language: 'en' | 'ar';
  sound: boolean;
}

export interface StoredGameData {
  version: 1;
  streak: number;
  lastDailyDate: string | null;
  personalBest: RunScore | null;
  history: GameHistoryEntry[];
  preferences: AppPreferences;
}

export const DEFAULT_DATA: StoredGameData = {
  version: 1,
  streak: 0,
  lastDailyDate: null,
  personalBest: null,
  history: [],
  preferences: { language: 'en', sound: false },
};

function isRunScore(value: unknown): value is RunScore {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return ['correct', 'mistakes', 'elapsedSeconds', 'score'].every(
    (key) => typeof record[key] === 'number' && Number.isFinite(record[key]),
  );
}

function cleanEntry(value: unknown): GameHistoryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (!isRunScore(item) || typeof item.date !== 'string' ||
      (item.mode !== 'daily' && item.mode !== 'practice') ||
      typeof item.finishedAt !== 'number' || !Number.isFinite(item.finishedAt)) return null;
  return {
    date: item.date,
    mode: item.mode,
    finishedAt: item.finishedAt,
    correct: Math.max(0, Math.floor(item.correct)),
    mistakes: Math.max(0, Math.floor(item.mistakes)),
    elapsedSeconds: Math.max(0, item.elapsedSeconds),
    score: Math.max(0, Math.floor(item.score)),
  };
}

export function readStoredData(): StoredGameData {
  if (typeof window === 'undefined') return { ...DEFAULT_DATA, preferences: { ...DEFAULT_DATA.preferences } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA, preferences: { ...DEFAULT_DATA.preferences } };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid saved game data');
    const record = parsed as Record<string, unknown>;
    const prefs = record.preferences && typeof record.preferences === 'object'
      ? record.preferences as Record<string, unknown>
      : {};
    return {
      version: 1,
      streak: typeof record.streak === 'number' ? Math.max(0, Math.floor(record.streak)) : 0,
      lastDailyDate: typeof record.lastDailyDate === 'string' ? record.lastDailyDate : null,
      personalBest: isRunScore(record.personalBest) ? record.personalBest : null,
      history: Array.isArray(record.history)
        ? record.history.map(cleanEntry).filter((entry): entry is GameHistoryEntry => entry !== null).slice(0, 100)
        : [],
      preferences: {
        language: prefs.language === 'ar' ? 'ar' : 'en',
        sound: prefs.sound === true,
      },
    };
  } catch {
    // Storage can be disabled, full, or contain an old/corrupt value. The game
    // remains playable in memory and simply starts with clean local data.
    return { ...DEFAULT_DATA, preferences: { ...DEFAULT_DATA.preferences } };
  }
}

export function writeStoredData(data: StoredGameData): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function saveCompletedRun(
  current: StoredGameData,
  result: RunScore,
  mode: 'daily' | 'practice',
  date: string,
  finishedAt = Date.now(),
  today = new Date().toISOString().slice(0, 10),
): StoredGameData {
  const entry: GameHistoryEntry = { ...result, mode, date, finishedAt };
  const history = [entry, ...current.history].slice(0, 100);
  let streak = current.streak;
  let lastDailyDate = current.lastDailyDate;
  let personalBest = current.personalBest;

  if (mode === 'daily') {
    if (date === today && lastDailyDate !== date) {
      const previousDay = new Date(`${date}T00:00:00.000Z`);
      previousDay.setUTCDate(previousDay.getUTCDate() - 1);
      const yesterday = previousDay.toISOString().slice(0, 10);
      streak = lastDailyDate === yesterday ? current.streak + 1 : 1;
      lastDailyDate = date;
    }
    if (!personalBest || result.score > personalBest.score ||
      (result.score === personalBest.score && result.elapsedSeconds < personalBest.elapsedSeconds)) {
      personalBest = result;
    }
  }

  return {
    ...current,
    streak,
    lastDailyDate,
    personalBest,
    history,
  };
}

export function updatePreferences(current: StoredGameData, preferences: Partial<AppPreferences>): StoredGameData {
  return { ...current, preferences: { ...current.preferences, ...preferences } };
}
