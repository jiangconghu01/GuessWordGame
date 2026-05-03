import { describe, it, expect } from 'vitest';
import { HighFreqEmbedder } from '../../src/similarity/HighFreqEmbedder.ts';

describe('HighFreqEmbedder', () => {
  const embedder = new HighFreqEmbedder();
  embedder.loadFrom({
    情绪: [1, 0, 0],
    心情: [0.9, 0.1, 0]
  });

  it('returns vector for known word', () => {
    expect(embedder.embed('情绪')).toEqual([1, 0, 0]);
  });

  it('returns null for unknown word', () => {
    expect(embedder.embed('不存在这个词')).toBeNull();
  });

  it('reports has() correctly', () => {
    expect(embedder.has('情绪')).toBe(true);
    expect(embedder.has('未知词')).toBe(false);
  });
});
