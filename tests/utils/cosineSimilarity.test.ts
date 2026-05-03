import { describe, it, expect } from 'vitest';
import {
  cosineSimilarity,
  magnitude,
  averageVectors
} from '../../src/utils/cosineSimilarity.ts';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('returns 0 for zero-magnitude inputs', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('returns 0 for length mismatch', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('magnitude', () => {
  it('computes vector magnitude', () => {
    expect(magnitude([3, 4])).toBe(5);
    expect(magnitude([0, 0, 0])).toBe(0);
  });
});

describe('averageVectors', () => {
  it('averages two vectors', () => {
    expect(averageVectors([[2, 4], [4, 8]])).toEqual([3, 6]);
  });

  it('returns empty array for empty input', () => {
    expect(averageVectors([])).toEqual([]);
  });

  it('handles single vector', () => {
    expect(averageVectors([[1, 2, 3]])).toEqual([1, 2, 3]);
  });
});
