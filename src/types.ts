export interface WordEntry {
  word: string;
  category: string;
  difficulty: number;
}

export interface GuessRecord {
  word: string;
  similarity: number;
  rank: number;
  timestamp: number;
  method?: SimilarityMethod;
}

export type GameStatus = 'loading' | 'idle' | 'playing' | 'won';

export interface GameState {
  status: GameStatus;
  targetWord: string;
  guesses: GuessRecord[];
  guessCount: number;
  startTime: number;
  bestScore: number;
  hintUsed: boolean;
}

export interface VectorMap {
  [token: string]: number[];
}

export type SimilarityMethod = 'exact' | 'highfreq' | 'charlevel' | 'unknown';

export interface SimilarityResult {
  similarity: number;
  method: SimilarityMethod;
}
