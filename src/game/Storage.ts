const PREFIX = 'gwg_';
const USED_WORDS_LIMIT = 30; // 仅记忆最近 N 个，避免词库耗尽

export interface GameResult {
  guessCount: number;
  elapsedMs: number;
  targetWord: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  totalGuesses: number;
  bestGuessCount: number;
  bestTimeMs: number;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalGuesses: 0,
  bestGuessCount: Number.POSITIVE_INFINITY,
  bestTimeMs: 0
};

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export const Storage = {
  saveGameResult(result: GameResult): void {
    if (!hasLocalStorage()) return;
    const stats = this.loadStats();
    stats.gamesPlayed++;
    stats.totalGuesses += result.guessCount;
    if (result.guessCount < stats.bestGuessCount) {
      stats.bestGuessCount = result.guessCount;
    }
    if (stats.bestTimeMs === 0 || result.elapsedMs < stats.bestTimeMs) {
      stats.bestTimeMs = result.elapsedMs;
    }
    localStorage.setItem(`${PREFIX}stats`, JSON.stringify(stats));

    const used = this.getUsedWords();
    const next = [...used.filter((w) => w !== result.targetWord), result.targetWord];
    while (next.length > USED_WORDS_LIMIT) next.shift();
    localStorage.setItem(`${PREFIX}usedWords`, JSON.stringify(next));
  },

  loadStats(): PlayerStats {
    if (!hasLocalStorage()) return { ...DEFAULT_STATS };
    const raw = localStorage.getItem(`${PREFIX}stats`);
    if (!raw) return { ...DEFAULT_STATS };
    try {
      const parsed = JSON.parse(raw) as PlayerStats;
      // bestGuessCount 可能被序列化为 null
      if (parsed.bestGuessCount == null) parsed.bestGuessCount = Number.POSITIVE_INFINITY;
      return parsed;
    } catch {
      return { ...DEFAULT_STATS };
    }
  },

  getUsedWords(): string[] {
    if (!hasLocalStorage()) return [];
    const raw = localStorage.getItem(`${PREFIX}usedWords`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  markWordUsed(word: string): void {
    if (!hasLocalStorage()) return;
    const used = this.getUsedWords();
    if (used.includes(word)) return;
    used.push(word);
    while (used.length > USED_WORDS_LIMIT) used.shift();
    localStorage.setItem(`${PREFIX}usedWords`, JSON.stringify(used));
  },

  clear(): void {
    if (!hasLocalStorage()) return;
    localStorage.removeItem(`${PREFIX}stats`);
    localStorage.removeItem(`${PREFIX}usedWords`);
  }
};
