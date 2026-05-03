import type { GuessRecord } from '../types.ts';

/**
 * 猜测历史面板
 *
 * 显示策略：按猜测时间倒序显示"最近一次"高亮，列表整体按相似度从高到低排序，
 * 每行带有冷热颜色分级（热/温/冷）。
 */
export class GuessHistory {
  private root: HTMLElement;
  private list: HTMLElement;
  private latestWord: string | null = null;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('section');
    this.root.className = 'guess-history';

    const title = document.createElement('h3');
    title.textContent = '猜测历史';

    this.list = document.createElement('ul');
    this.list.className = 'guess-list';

    this.root.append(title, this.list);
    parent.appendChild(this.root);
  }

  setLatest(word: string | null): void {
    this.latestWord = word;
  }

  render(guesses: GuessRecord[]): void {
    this.list.innerHTML = '';
    if (guesses.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'guess-empty';
      empty.textContent = '暂无猜测，输入任意词语开始吧';
      this.list.appendChild(empty);
      return;
    }
    const sorted = [...guesses].sort((a, b) => b.similarity - a.similarity);
    for (const g of sorted) {
      const li = document.createElement('li');
      li.className = `guess-item ${this.tempClass(g.similarity)}`;
      if (g.word === this.latestWord) li.classList.add('latest');

      const pct = (g.similarity * 100).toFixed(1);
      const icon = this.tempIcon(g.similarity);
      const rank = document.createElement('span');
      rank.className = 'guess-rank';
      rank.textContent = `#${g.rank}`;

      const word = document.createElement('span');
      word.className = 'guess-word';
      word.textContent = g.word;

      const sim = document.createElement('span');
      sim.className = 'guess-sim';
      sim.textContent = `${icon} ${pct}%`;

      const bar = document.createElement('div');
      bar.className = 'guess-bar';
      const fill = document.createElement('div');
      fill.className = 'guess-bar-fill';
      fill.style.width = `${Math.max(2, Math.min(100, g.similarity * 100))}%`;
      bar.appendChild(fill);

      li.append(rank, word, bar, sim);
      this.list.appendChild(li);
    }
  }

  private tempClass(sim: number): string {
    if (sim >= 0.8) return 'hot';
    if (sim >= 0.5) return 'warm';
    if (sim >= 0.2) return 'cool';
    return 'cold';
  }

  private tempIcon(sim: number): string {
    if (sim >= 0.8) return '🔥';
    if (sim >= 0.5) return '🌡️';
    if (sim >= 0.2) return '💧';
    return '❄️';
  }

  destroy(): void {
    this.root.remove();
  }
}
