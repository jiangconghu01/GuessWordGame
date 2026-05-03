import { GameEngine } from '../game/GameEngine.ts';
import { Storage } from '../game/Storage.ts';
import { GuessInput } from './GuessInput.ts';
import { GuessHistory } from './GuessHistory.ts';
import { ResultPanel } from './ResultPanel.ts';

/**
 * App 组合根：组装 UI、串联事件
 */
export class App {
  private container: HTMLElement;
  private engine: GameEngine;
  private input?: GuessInput;
  private history?: GuessHistory;
  private result?: ResultPanel;
  private toastTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.engine = new GameEngine();
  }

  async init(): Promise<void> {
    this.renderShell();
    this.setStatusText('加载词库与向量中…');
    try {
      await this.engine.init();
    } catch (e) {
      this.setStatusText('资源加载失败，请检查 public/ 下的 JSON 文件');
      // eslint-disable-next-line no-console
      console.error(e);
      return;
    }
    this.showIdle();
  }

  private renderShell(): void {
    this.container.innerHTML = `
      <header class="app-header">
        <h1>🎯 猜词游戏</h1>
        <p class="subtitle">输入任意中文词语，凭语义关联度找到目标词</p>
      </header>
      <main class="app-main"></main>
      <footer class="app-footer">
        <span>纯前端 · TypeScript + Vite · 多级语义 Fallback</span>
      </footer>
      <div id="toast" class="toast" aria-live="polite"></div>
    `;
  }

  private get main(): HTMLElement {
    return this.container.querySelector('.app-main') as HTMLElement;
  }

  private setStatusText(text: string): void {
    this.main.innerHTML = `<div class="loading">${text}</div>`;
  }

  private showIdle(): void {
    const stats = Storage.loadStats();
    this.main.innerHTML = '';

    const statsEl = document.createElement('div');
    statsEl.className = 'stats-summary';
    if (stats.gamesPlayed > 0) {
      const best =
        stats.bestGuessCount === Number.POSITIVE_INFINITY ? '-' : `${stats.bestGuessCount} 次`;
      const bestTime = stats.bestTimeMs > 0 ? `${Math.round(stats.bestTimeMs / 1000)} 秒` : '-';
      statsEl.innerHTML = `
        <div class="stats-grid">
          <div><span class="stats-num">${stats.gamesPlayed}</span><span class="stats-lbl">已通关</span></div>
          <div><span class="stats-num">${best}</span><span class="stats-lbl">最少猜测</span></div>
          <div><span class="stats-num">${bestTime}</span><span class="stats-lbl">最快用时</span></div>
        </div>
      `;
    } else {
      statsEl.innerHTML = '<p class="welcome">欢迎来到猜词游戏！点击下方按钮开始第一局。</p>';
    }
    this.main.appendChild(statsEl);

    this.result = new ResultPanel(this.main);
    this.result.reset();
    this.result.showIdle(() => this.startGame());
  }

  private startGame(): void {
    this.engine.startNewGame();
    this.main.innerHTML = '';

    const gameArea = document.createElement('div');
    gameArea.className = 'game-area';
    this.main.appendChild(gameArea);

    this.result = new ResultPanel(gameArea);
    this.result.reset();

    this.input = new GuessInput(gameArea);
    this.input.setOnSubmit((val) => this.handleGuess(val));

    this.history = new GuessHistory(gameArea);
    this.history.render([]);

    const controls = document.createElement('div');
    controls.className = 'game-controls';
    controls.innerHTML = `
      <button id="btn-hint" type="button">💡 给点提示</button>
      <button id="btn-skip" type="button">🔄 换一个新词</button>
      <button id="btn-give-up" type="button">🏳️ 放弃本局</button>
    `;
    gameArea.appendChild(controls);

    controls.querySelector('#btn-hint')?.addEventListener('click', () => this.showHint());
    controls.querySelector('#btn-skip')?.addEventListener('click', () => this.startGame());
    controls.querySelector('#btn-give-up')?.addEventListener('click', () => this.handleGiveUp());

    this.input.focus();
  }

  private handleGuess(value: string): void {
    const before = this.engine.getState().guessCount;
    const result = this.engine.makeGuess(value);
    const state = this.engine.getState();
    const isDuplicate = state.guessCount === before;

    this.result?.showLatest(value, result.similarity);
    this.history?.setLatest(value);
    this.history?.render(state.guesses);

    if (isDuplicate) {
      this.toast(`「${value}」已猜过，关联度 ${(result.similarity * 100).toFixed(1)}%`);
    }
    if (result.method === 'unknown' && !isDuplicate) {
      this.toast('无法识别该输入，可换一个常见词试试');
    }

    if (state.status === 'won') {
      this.engine.saveResult();
      this.input?.setDisabled(true);
      this.result?.showWin(state, () => this.startGame());
    } else {
      this.input?.focus();
    }
  }

  private handleGiveUp(): void {
    const target = this.engine.giveUp();
    this.input?.setDisabled(true);
    this.result?.showGiveUp(target, () => this.startGame());
  }

  private showHint(): void {
    const hint = this.engine.useHint();
    if (hint) this.toast(`💡 提示：目标词属于「${hint}」类别`);
    else this.toast('已经使用过提示啦');
  }

  private toast(text: string): void {
    const t = this.container.querySelector('#toast') as HTMLElement | null;
    if (!t) return;
    t.textContent = text;
    t.classList.add('show');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('show'), 2400);
  }
}
