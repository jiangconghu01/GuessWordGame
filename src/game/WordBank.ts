import type { WordEntry } from '../types.ts';

/**
 * 词库管理：加载、随机抽取、避免短期重复
 */
export class WordBank {
  private words: WordEntry[] = [];

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WordBank: failed to load ${url}`);
    this.words = (await res.json()) as WordEntry[];
  }

  /** 直接注入词库（测试用） */
  loadFrom(words: WordEntry[]): void {
    this.words = words;
  }

  getAll(): WordEntry[] {
    return this.words;
  }

  size(): number {
    return this.words.length;
  }

  pickRandom(exclude: string[] = []): WordEntry | null {
    if (this.words.length === 0) return null;
    let pool = this.words.filter((w) => !exclude.includes(w.word));
    if (pool.length === 0) pool = this.words;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  find(word: string): WordEntry | undefined {
    return this.words.find((w) => w.word === word);
  }
}
