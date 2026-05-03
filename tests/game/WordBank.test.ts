import { describe, it, expect } from 'vitest';
import { WordBank } from '../../src/game/WordBank.ts';

const fixture = [
  { word: '情绪', category: '情感', difficulty: 1 },
  { word: '桌子', category: '物品', difficulty: 1 },
  { word: '太阳', category: '自然', difficulty: 1 }
];

describe('WordBank', () => {
  it('returns loaded words', () => {
    const bank = new WordBank();
    bank.loadFrom(fixture);
    expect(bank.size()).toBe(3);
    expect(bank.getAll()).toEqual(fixture);
  });

  it('picks a random word when no exclusion', () => {
    const bank = new WordBank();
    bank.loadFrom(fixture);
    const w = bank.pickRandom();
    expect(w).not.toBeNull();
    expect(fixture.some((f) => f.word === w!.word)).toBe(true);
  });

  it('excludes provided words', () => {
    const bank = new WordBank();
    bank.loadFrom(fixture);
    const exclude = ['情绪', '桌子'];
    for (let i = 0; i < 20; i++) {
      const w = bank.pickRandom(exclude);
      expect(w!.word).toBe('太阳');
    }
  });

  it('falls back to full pool when all excluded', () => {
    const bank = new WordBank();
    bank.loadFrom(fixture);
    const w = bank.pickRandom(['情绪', '桌子', '太阳']);
    expect(w).not.toBeNull();
  });

  it('returns null when bank is empty', () => {
    const bank = new WordBank();
    expect(bank.pickRandom()).toBeNull();
  });

  it('finds word entry', () => {
    const bank = new WordBank();
    bank.loadFrom(fixture);
    expect(bank.find('桌子')?.category).toBe('物品');
    expect(bank.find('未知')).toBeUndefined();
  });
});
