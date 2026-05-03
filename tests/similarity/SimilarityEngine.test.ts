import { describe, it, expect } from 'vitest';
import { SimilarityEngine } from '../../src/similarity/SimilarityEngine.ts';

function buildEngine(): SimilarityEngine {
  const engine = new SimilarityEngine();
  engine.highFreq.loadFrom({
    情绪: [1, 0, 0, 0],
    心情: [0.9, 0.4, 0, 0],
    桌子: [0, 0, 1, 0]
  });
  engine.charLevel.loadFrom({
    情: [1, 0, 0, 0],
    绪: [0.9, 0.1, 0, 0],
    心: [0.8, 0.2, 0, 0],
    金: [0, 0, 0, 1]
  });
  return engine;
}

describe('SimilarityEngine', () => {
  it('returns exact match for identical normalized words', () => {
    const engine = buildEngine();
    const r = engine.compare('情绪', '情绪');
    expect(r.similarity).toBe(1);
    expect(r.method).toBe('exact');
  });

  it('returns high similarity for related highfreq words', () => {
    const engine = buildEngine();
    const r = engine.compare('情绪', '心情');
    expect(r.similarity).toBeGreaterThan(0.5);
    expect(r.method).toBe('highfreq');
  });

  it('returns low similarity for unrelated words via charlevel fallback', () => {
    const engine = buildEngine();
    const r = engine.compare('情绪', '金'); // 金 不在高频表
    expect(r.method).toBe('charlevel');
    expect(r.similarity).toBeLessThan(0.3);
  });

  it('returns 0 for completely unknown input', () => {
    const engine = buildEngine();
    const r = engine.compare('情绪', '𠮷𠮷𠮷');
    expect(r.similarity).toBe(0);
    expect(r.method).toBe('unknown');
  });

  it('clamps negative cosine to 0', () => {
    const engine = new SimilarityEngine();
    engine.highFreq.loadFrom({ a: [1, 0], b: [-1, 0] });
    engine.charLevel.loadFrom({});
    const r = engine.compare('a', 'b');
    expect(r.similarity).toBe(0);
  });
});
