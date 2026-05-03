import { averageVectors } from '../utils/cosineSimilarity.ts';
import { splitChars } from '../utils/textNormalize.ts';
import type { VectorMap } from '../types.ts';

/**
 * 字符级向量编码 - 三级 Fallback（保底）
 *
 * 将词拆分为单字，对每个字的向量做平均得到词向量。
 * 当超过 50% 字符无法识别时返回 null（视为完全未知）。
 */
export class CharLevelEmbedder {
  private vectors: VectorMap = {};
  private loaded = false;

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`CharLevelEmbedder: failed to load ${url} (${res.status})`);
    }
    this.vectors = (await res.json()) as VectorMap;
    this.loaded = true;
  }

  loadFrom(vectors: VectorMap): void {
    this.vectors = vectors;
    this.loaded = true;
  }

  embed(word: string): number[] | null {
    if (!this.loaded) return null;
    const chars = splitChars(word);
    if (chars.length === 0) return null;

    const known: number[][] = [];
    for (const ch of chars) {
      const vec = this.vectors[ch];
      if (vec) known.push(vec);
    }
    if (known.length === 0) return null;
    if (known.length / chars.length < 0.5) return null;
    return averageVectors(known);
  }

  has(char: string): boolean {
    return this.loaded && char in this.vectors;
  }
}
