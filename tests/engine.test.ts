import { describe, expect, it } from 'vitest';
import {
  calculateScore,
  createDailyChallenge,
  createPracticeChallenge,
  createRunScore,
  getUtcDate,
  hashSeed,
  isValidDateKey,
} from '../src/game/engine';
import { DEFAULT_DATA, saveCompletedRun } from '../src/game/storage';

function attrs(tile: { color: string; rotation: number; scale: number; symbol: string }) {
  return [tile.color, tile.rotation, tile.scale, tile.symbol].join('|');
}

describe('daily puzzle determinism', () => {
  it('creates the same seed and same puzzles for the same UTC date', () => {
    const first = createDailyChallenge('2026-10-28');
    const second = createDailyChallenge('2026-10-28');
    expect(first.seed).toBe(second.seed);
    expect(first.rounds).toEqual(second.rounds);
    expect(createDailyChallenge('2026-10-29').seed).not.toBe(first.seed);
  });

  it('creates five rounds with exactly one distinct tile in every round', () => {
    const challenge = createDailyChallenge('2026-10-28');
    expect(challenge.rounds).toHaveLength(5);
    for (const round of challenge.rounds) {
      expect(round.tiles).toHaveLength(round.rows * round.columns);
      expect(round.oddIndex).toBeGreaterThanOrEqual(0);
      expect(round.oddIndex).toBeLessThan(round.tiles.length);
      const odd = round.tiles[round.oddIndex]!;
      const otherValues = round.tiles.filter((_, i) => i !== round.oddIndex).map(attrs);
      expect(new Set(otherValues).size).toBe(1);
      expect(attrs(odd)).not.toBe(otherValues[0]);
      const differingProperties = ['color', 'rotation', 'scale', 'symbol'].filter((key) => {
        const oddValue = odd[key as keyof typeof odd];
        return round.tiles.some((tile, index) => index !== round.oddIndex && tile[key as keyof typeof tile] !== oddValue);
      });
      expect(differingProperties).toHaveLength(1);
      expect(differingProperties[0]).toBe(round.mode === 'size' ? 'scale' : round.mode);
    }
  });

  it('rejects malformed dates instead of creating unstable daily puzzles', () => {
    expect(isValidDateKey('2026-10-28')).toBe(true);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('yesterday')).toBe(false);
    expect(() => createDailyChallenge('2026-02-30')).toThrow(/Invalid challenge date/);
  });

  it('uses a stable non-zero hash for the daily namespace', () => {
    expect(hashSeed('odd-one-out-daily:2026-10-28:v1')).toBe(hashSeed('odd-one-out-daily:2026-10-28:v1'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('generates a five-round practice challenge for edge-case seeds', () => {
    for (const seed of [0, 1, -1, Number.MAX_SAFE_INTEGER, Number.NaN]) {
      const challenge = createPracticeChallenge(seed);
      expect(challenge.rounds).toHaveLength(5);
      expect(challenge.rounds.every((round) => round.tiles.length === round.rows * round.columns)).toBe(true);
      for (const round of challenge.rounds) {
        const odd = round.tiles[round.oddIndex]!;
        const regulars = round.tiles.filter((_, tileIndex) => tileIndex !== round.oddIndex);
        expect(new Set(regulars.map(attrs)).size).toBe(1);
        expect(attrs(odd)).not.toBe(attrs(regulars[0]!));
      }
    }
  });
});

describe('scoring', () => {
  it('awards 100 per correct answer and subtracts 20 per mistake', () => {
    expect(calculateScore(5, 0)).toBe(500);
    expect(calculateScore(3, 2)).toBe(260);
    expect(calculateScore(0, 1)).toBe(0);
  });

  it('clamps invalid or negative score inputs', () => {
    expect(calculateScore(-5, -3)).toBe(0);
    expect(calculateScore(Number.NaN, 4)).toBe(0);
    expect(calculateScore(1.9, 1.9)).toBe(80);
  });

  it('rounds elapsed milliseconds to a tenth of a second and clamps negative time', () => {
    expect(createRunScore(3, 1, 1234)).toEqual({ correct: 3, mistakes: 1, elapsedSeconds: 1.2, score: 280 });
    expect(createRunScore(0, 0, -10).elapsedSeconds).toBe(0);
  });
});

describe('local streak and personal best', () => {
  it('increments a streak only on consecutive current-day completions', () => {
    const first = saveCompletedRun(DEFAULT_DATA, { correct: 2, mistakes: 0, elapsedSeconds: 12, score: 200 }, 'daily', '2026-10-28', 1, '2026-10-28');
    expect(first.streak).toBe(1);
    const next = saveCompletedRun(first, { correct: 3, mistakes: 0, elapsedSeconds: 10, score: 300 }, 'daily', '2026-10-29', 2, '2026-10-29');
    expect(next.streak).toBe(2);
    const replay = saveCompletedRun(next, { correct: 1, mistakes: 0, elapsedSeconds: 8, score: 100 }, 'daily', '2026-10-29', 3, '2026-10-29');
    expect(replay.streak).toBe(2);
  });

  it('does not change the active streak when playing a shared historical challenge', () => {
    const current = { ...DEFAULT_DATA, streak: 4, lastDailyDate: '2026-10-28' };
    const historical = saveCompletedRun(current, { correct: 5, mistakes: 0, elapsedSeconds: 30, score: 500 }, 'daily', '2026-10-20', 3, '2026-10-28');
    expect(historical.streak).toBe(4);
    expect(historical.lastDailyDate).toBe('2026-10-28');
  });

  it('keeps a better personal best based on score then time', () => {
    const first = saveCompletedRun(DEFAULT_DATA, { correct: 3, mistakes: 0, elapsedSeconds: 20, score: 300 }, 'daily', '2026-10-28', 1, '2026-10-28');
    const faster = saveCompletedRun(first, { correct: 3, mistakes: 0, elapsedSeconds: 18, score: 300 }, 'daily', '2026-10-28', 2, '2026-10-28');
    expect(faster.personalBest?.elapsedSeconds).toBe(18);
    const practice = saveCompletedRun(faster, { correct: 5, mistakes: 0, elapsedSeconds: 7, score: 500 }, 'practice', '2026-10-28', 3, '2026-10-28');
    expect(practice.personalBest?.score).toBe(300);
  });
});

describe('UTC date key', () => {
  it('uses UTC rather than device-local time', () => {
    expect(getUtcDate(new Date('2026-10-28T23:59:59.000Z'))).toBe('2026-10-28');
    expect(getUtcDate(new Date('2026-10-29T00:00:00.000Z'))).toBe('2026-10-29');
  });
});
