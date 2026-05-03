import { describe, it, expect } from 'vitest';
import { CharLevelEmbedder } from '../../src/similarity/CharLevelEmbedder.ts';

describe('CharLevelEmbedder', () => {
  const embedder = new CharLevelEmbedder();
  embedder.loadFrom({
    桌: [1, 0],
    子: [0.8, 0.2],
    心: [0.5, 0.5]
  });

  it('averages known chars', () => {
    const v = embedder.embed('桌子');
    expect(v).not.toBeNull();
    expect(v!.length).toBe(2);
    expect(v![0]).toBeCloseTo(0.9);
    expect(v![1]).toBeCloseTo(0.1);
  });

  it('returns null when all chars unknown', () => {
    expect(embedder.embed('𠮷𠮷')).toBeNull();
  });

  it('returns null when known char ratio < 50%', () => {
    // 桌 known, 三个未知字 -> 1/4 < 0.5
    expect(embedder.embed('桌甲乙丙')).toBeNull();
  });

  it('handles single known char', () => {
    expect(embedder.embed('心')).toEqual([0.5, 0.5]);
  });
});
