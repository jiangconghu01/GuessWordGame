import type { GuessRecord } from '../types.ts';

/**
 * 计分与排序工具
 */
export const Scoring = {
  /** 按相似度从高到低排序，并写入 rank 字段 */
  rankGuesses(guesses: GuessRecord[]): GuessRecord[] {
    const sorted = [...guesses].sort((a, b) => b.similarity - a.similarity);
    return sorted.map((g, i) => ({ ...g, rank: i + 1 }));
  },

  computeStats(guesses: GuessRecord[], startTime: number) {
    const elapsed = Date.now() - startTime;
    return {
      guessCount: guesses.length,
      elapsedMs: elapsed,
      bestSimilarity: guesses.length > 0 ? Math.max(...guesses.map((g) => g.similarity)) : 0
    };
  }
};
