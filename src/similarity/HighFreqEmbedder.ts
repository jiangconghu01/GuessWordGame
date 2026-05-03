import type { VectorMap } from '../types.ts';

/**
 * 高频词精确向量查询 - 一级 Fallback
 */
export class HighFreqEmbedder {
  private vectors: VectorMap = {};
  private loaded = false;

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HighFreqEmbedder: failed to load ${url} (${res.status})`);
    }
    this.vectors = (await res.json()) as VectorMap;
    this.loaded = true;
  }

  /** 直接注入向量（测试用） */
  loadFrom(vectors: VectorMap): void {
    this.vectors = vectors;
    this.loaded = true;
  }

  embed(word: string): number[] | null {
    if (!this.loaded) return null;
    return this.vectors[word] ?? null;
  }

  has(word: string): boolean {
    return this.loaded && word in this.vectors;
  }
}
