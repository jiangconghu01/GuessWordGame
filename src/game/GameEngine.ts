import { WordBank } from './WordBank.ts';
import { Scoring } from './Scoring.ts';
import { Storage } from './Storage.ts';
import { SimilarityEngine } from '../similarity/SimilarityEngine.ts';
import { normalizeText } from '../utils/textNormalize.ts';
import type { GameState, GuessRecord, SimilarityResult } from '../types.ts';

/**
 * 游戏主引擎：管理状态机、猜测流程、提示与结算
 */
export class GameEngine {
  readonly wordBank = new WordBank();
  readonly similarity = new SimilarityEngine();
  private state: GameState = this.createInitialState();
  private usedWords: string[] = [];
  private resultSaved = false;

  private createInitialState(): GameState {
    return {
      status: 'idle',
      targetWord: '',
      guesses: [],
      guessCount: 0,
      startTime: 0,
      bestScore: 0,
      hintUsed: false
    };
  }

  async init(
    wordBankUrl = '/word-bank.json',
    highFreqUrl = '/highfreq-vectors.json',
    charUrl = '/char-vectors.json'
  ): Promise<void> {
    await Promise.all([
      this.wordBank.load(wordBankUrl),
      this.similarity.init(highFreqUrl, charUrl)
    ]);
    this.usedWords = Storage.getUsedWords();
    this.state.status = 'idle';
  }

  startNewGame(): void {
    const entry = this.wordBank.pickRandom(this.usedWords);
    if (!entry) {
      // 词库耗尽：清空已用列表重来
      this.usedWords = [];
      const fallback = this.wordBank.pickRandom();
      if (!fallback) throw new Error('Word bank is empty');
      this.beginRound(fallback.word);
      return;
    }
    this.beginRound(entry.word);
  }

  private beginRound(word: string): void {
    this.state = {
      status: 'playing',
      targetWord: word,
      guesses: [],
      guessCount: 0,
      startTime: Date.now(),
      bestScore: 0,
      hintUsed: false
    };
    this.resultSaved = false;
  }

  makeGuess(rawInput: string): SimilarityResult {
    if (this.state.status !== 'playing') {
      return { similarity: 0, method: 'unknown' };
    }
    const input = normalizeText(rawInput);
    if (!input) return { similarity: 0, method: 'unknown' };

    // 重复猜测：返回旧分数，不计入次数
    const existing = this.state.guesses.find((g) => normalizeText(g.word) === input);
    if (existing) {
      return {
        similarity: existing.similarity,
        method: existing.method ?? 'exact'
      };
    }

    const result = this.similarity.compare(this.state.targetWord, input);
    const record: GuessRecord = {
      word: rawInput,
      similarity: result.similarity,
      rank: 0,
      timestamp: Date.now(),
      method: result.method
    };
    this.state.guesses.push(record);
    this.state.guessCount++;
    if (result.similarity > this.state.bestScore) {
      this.state.bestScore = result.similarity;
    }
    if (input === normalizeText(this.state.targetWord)) {
      this.state.status = 'won';
    }
    this.state.guesses = Scoring.rankGuesses(this.state.guesses);
    return result;
  }

  /** 解锁本轮提示，返回类别名 */
  useHint(): string | null {
    if (this.state.hintUsed || this.state.status !== 'playing') return null;
    const entry = this.wordBank.find(this.state.targetWord);
    if (!entry) return null;
    this.state.hintUsed = true;
    return entry.category;
  }

  /** 放弃当前局：揭示答案并切到 idle */
  giveUp(): string {
    const target = this.state.targetWord;
    this.state.status = 'idle';
    return target;
  }

  /** 胜利后保存战绩，幂等 */
  saveResult(): void {
    if (this.state.status !== 'won' || this.resultSaved) return;
    Storage.saveGameResult({
      guessCount: this.state.guessCount,
      elapsedMs: Date.now() - this.state.startTime,
      targetWord: this.state.targetWord
    });
    this.usedWords = Storage.getUsedWords();
    this.resultSaved = true;
  }

  getState(): GameState {
    return { ...this.state, guesses: [...this.state.guesses] };
  }
}
