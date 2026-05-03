import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../../src/game/GameEngine.ts';

function buildEngine(): GameEngine {
  const engine = new GameEngine();
  engine.wordBank.loadFrom([
    { word: '情绪', category: '情感', difficulty: 1 },
    { word: '心情', category: '情感', difficulty: 1 },
    { word: '桌子', category: '物品', difficulty: 1 }
  ]);
  engine.similarity.highFreq.loadFrom({
    情绪: [1, 0, 0],
    心情: [0.9, 0.4, 0],
    桌子: [0, 0, 1]
  });
  engine.similarity.charLevel.loadFrom({
    情: [1, 0, 0],
    绪: [0.95, 0.1, 0],
    心: [0.8, 0.3, 0]
  });
  return engine;
}

describe('GameEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    // 让 Math.random 可控，先固定到 0 -> 选中 "情绪"
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  it('starts in playing state with target word', () => {
    const engine = buildEngine();
    engine.startNewGame();
    const s = engine.getState();
    expect(s.status).toBe('playing');
    expect(s.targetWord).toBe('情绪');
  });

  it('records guess and updates history', () => {
    const engine = buildEngine();
    engine.startNewGame();
    const r = engine.makeGuess('心情');
    expect(r.method).toBe('highfreq');
    expect(r.similarity).toBeGreaterThan(0.5);
    const s = engine.getState();
    expect(s.guessCount).toBe(1);
    expect(s.guesses.length).toBe(1);
    expect(s.bestScore).toBeGreaterThan(0.5);
  });

  it('wins when exact target guessed', () => {
    const engine = buildEngine();
    engine.startNewGame();
    const r = engine.makeGuess('情绪');
    expect(r.similarity).toBe(1);
    expect(engine.getState().status).toBe('won');
  });

  it('deduplicates repeated guesses without incrementing count', () => {
    const engine = buildEngine();
    engine.startNewGame();
    engine.makeGuess('心情');
    engine.makeGuess('心情');
    expect(engine.getState().guessCount).toBe(1);
  });

  it('useHint returns category once', () => {
    const engine = buildEngine();
    engine.startNewGame();
    expect(engine.useHint()).toBe('情感');
    expect(engine.useHint()).toBeNull();
    expect(engine.getState().hintUsed).toBe(true);
  });

  it('saveResult persists stats only on won', () => {
    const engine = buildEngine();
    engine.startNewGame();
    engine.makeGuess('心情');
    engine.saveResult();
    expect(JSON.parse(localStorage.getItem('gwg_stats') ?? '{}').gamesPlayed ?? 0).toBe(0);
    engine.makeGuess('情绪');
    engine.saveResult();
    expect(JSON.parse(localStorage.getItem('gwg_stats') ?? '{}').gamesPlayed).toBe(1);
  });

  it('giveUp transitions to idle and reveals target', () => {
    const engine = buildEngine();
    engine.startNewGame();
    const target = engine.giveUp();
    expect(target).toBe('情绪');
    expect(engine.getState().status).toBe('idle');
  });
});
