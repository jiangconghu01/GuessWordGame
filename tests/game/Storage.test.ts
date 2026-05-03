import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../../src/game/Storage.ts';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default stats when empty', () => {
    const s = Storage.loadStats();
    expect(s.gamesPlayed).toBe(0);
    expect(s.bestGuessCount).toBe(Number.POSITIVE_INFINITY);
  });

  it('persists best guess count', () => {
    Storage.saveGameResult({ guessCount: 5, elapsedMs: 12000, targetWord: '情绪' });
    Storage.saveGameResult({ guessCount: 3, elapsedMs: 18000, targetWord: '桌子' });
    Storage.saveGameResult({ guessCount: 7, elapsedMs: 8000, targetWord: '太阳' });
    const s = Storage.loadStats();
    expect(s.gamesPlayed).toBe(3);
    expect(s.totalGuesses).toBe(15);
    expect(s.bestGuessCount).toBe(3);
    expect(s.bestTimeMs).toBe(8000);
  });

  it('tracks used words and dedupes', () => {
    Storage.markWordUsed('桌子');
    Storage.markWordUsed('桌子');
    Storage.markWordUsed('太阳');
    expect(Storage.getUsedWords()).toEqual(['桌子', '太阳']);
  });

  it('caps used-words list', () => {
    for (let i = 0; i < 50; i++) {
      Storage.saveGameResult({ guessCount: 1, elapsedMs: 1, targetWord: `w${i}` });
    }
    expect(Storage.getUsedWords().length).toBeLessThanOrEqual(30);
  });
});
