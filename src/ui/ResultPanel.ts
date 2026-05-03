import type { GameState } from '../types.ts';

/**
 * 当前结果展示：进度条 + 数值 + 胜利后揭示
 */
export class ResultPanel {
  private root: HTMLElement;
  private similarityBar: HTMLElement;
  private similarityFill: HTMLElement;
  private similarityText: HTMLElement;
  private targetReveal: HTMLElement;
  private actionArea: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('section');
    this.root.className = 'result-panel';

    this.similarityText = document.createElement('div');
    this.similarityText.className = 'similarity-text';
    this.similarityText.textContent = '关联度: --';

    this.similarityBar = document.createElement('div');
    this.similarityBar.className = 'similarity-bar';
    this.similarityFill = document.createElement('div');
    this.similarityFill.className = 'similarity-fill';
    this.similarityBar.appendChild(this.similarityFill);

    this.targetReveal = document.createElement('div');
    this.targetReveal.className = 'target-reveal';

    this.actionArea = document.createElement('div');
    this.actionArea.className = 'action-area';

    this.root.append(this.similarityText, this.similarityBar, this.targetReveal, this.actionArea);
    parent.appendChild(this.root);
  }

  showLatest(word: string, similarity: number): void {
    const pct = (similarity * 100).toFixed(1);
    this.similarityText.textContent = `「${word}」关联度: ${pct}%`;
    this.similarityFill.style.width = `${Math.min(100, Math.max(0, similarity * 100))}%`;
  }

  reset(): void {
    this.similarityText.textContent = '关联度: --';
    this.similarityFill.style.width = '0%';
    this.targetReveal.textContent = '';
    this.targetReveal.className = 'target-reveal';
    this.actionArea.innerHTML = '';
  }

  showWin(state: GameState, onNext: () => void): void {
    this.targetReveal.innerHTML = `🎉 答案是 <strong>${escapeHtml(state.targetWord)}</strong>`;
    this.targetReveal.classList.add('won');
    const seconds = Math.max(1, Math.floor((Date.now() - state.startTime) / 1000));
    this.actionArea.innerHTML = `
      <p class="result-stats">用时 ${seconds} 秒，共猜了 ${state.guessCount} 次</p>
      <button id="btn-next" class="btn-primary" type="button">再来一局</button>
    `;
    this.actionArea.querySelector('#btn-next')?.addEventListener('click', onNext);
  }

  showGiveUp(target: string, onNext: () => void): void {
    this.targetReveal.innerHTML = `答案是 <strong>${escapeHtml(target)}</strong>`;
    this.targetReveal.classList.add('giveup');
    this.actionArea.innerHTML = '<button id="btn-next" class="btn-primary" type="button">再来一局</button>';
    this.actionArea.querySelector('#btn-next')?.addEventListener('click', onNext);
  }

  showIdle(onStart: () => void): void {
    this.actionArea.innerHTML = '<button id="btn-start" class="btn-primary" type="button">开始游戏</button>';
    this.actionArea.querySelector('#btn-start')?.addEventListener('click', onStart);
  }

  destroy(): void {
    this.root.remove();
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
