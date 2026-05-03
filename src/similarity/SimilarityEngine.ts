import { HighFreqEmbedder } from './HighFreqEmbedder.ts';
import { CharLevelEmbedder } from './CharLevelEmbedder.ts';
import { cosineSimilarity } from '../utils/cosineSimilarity.ts';
import { normalizeText } from '../utils/textNormalize.ts';
import type { SimilarityResult } from '../types.ts';

/**
 * 相似度计算调度器
 *
 * Fallback 链：
 *   归一化完全相同 -> exact (1.0)
 *   两侧都命中高频词向量 -> highfreq
 *   两侧都能用字向量平均 -> charlevel
 *   否则 -> unknown (0.0)
 */
export class SimilarityEngine {
  readonly highFreq = new HighFreqEmbedder();
  readonly charLevel = new CharLevelEmbedder();

  async init(
    highFreqUrl = '/highfreq-vectors.json',
    charUrl = '/char-vectors.json'
  ): Promise<void> {
    await Promise.all([this.highFreq.load(highFreqUrl), this.charLevel.load(charUrl)]);
  }

  compare(target: string, guess: string): SimilarityResult {
    const t = normalizeText(target);
    const g = normalizeText(guess);

    if (!t || !g) return { similarity: 0, method: 'unknown' };
    if (t === g) return { similarity: 1, method: 'exact' };

    // Level 1: 高频词精确向量
    const tHi = this.highFreq.embed(t);
    const gHi = this.highFreq.embed(g);
    if (tHi && gHi) {
      const sim = cosineSimilarity(tHi, gHi);
      return { similarity: Math.max(0, sim), method: 'highfreq' };
    }

    // Level 3: 字符级向量保底
    // 注：目标词通常一定在高频词表中；只要任一侧不在，统一退化为字向量比较，保证一致基准
    const tCh = tHi ?? this.charLevel.embed(t);
    const gCh = gHi ?? this.charLevel.embed(g);
    if (tCh && gCh) {
      const sim = cosineSimilarity(tCh, gCh);
      return { similarity: Math.max(0, sim), method: 'charlevel' };
    }

    return { similarity: 0, method: 'unknown' };
  }
}
