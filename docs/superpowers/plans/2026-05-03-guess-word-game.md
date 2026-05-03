# GuessWordGame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend Chinese semantic word-guessing game where players input any Chinese word and receive a similarity score (0%–100%) against a hidden target word until they guess correctly.

**Architecture:** A vanilla TypeScript + Vite SPA with no UI framework. Game state is managed by a central `GameEngine` class. Similarity computation uses a three-tier fallback chain: high-frequency word exact vectors → char-level averaged vectors → unknown fallback. All vector data is static JSON loaded at startup. Styling uses native CSS with CSS variables for theming.

**Tech Stack:** Vite (vanilla-ts), TypeScript, Vitest + jsdom for unit tests, native CSS3, static JSON assets.

---

## File Structure

```
GuessWordGame/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── types.ts
│   ├── utils/
│   │   ├── textNormalize.ts
│   │   └── cosineSimilarity.ts
│   ├── data/
│   │   └── generateMockData.ts       # Node script to build vector JSONs
│   ├── similarity/
│   │   ├── SimilarityEngine.ts
│   │   ├── HighFreqEmbedder.ts
│   │   └── CharLevelEmbedder.ts
│   ├── game/
│   │   ├── WordBank.ts
│   │   ├── Scoring.ts
│   │   └── GameEngine.ts
│   └── ui/
│       ├── App.ts
│       ├── GuessInput.ts
│       ├── GuessHistory.ts
│       └── ResultPanel.ts
├── public/
│   ├── word-bank.json
│   ├── char-vectors.json
│   └── highfreq-vectors.json
├── tests/
│   ├── utils/
│   │   ├── textNormalize.test.ts
│   │   └── cosineSimilarity.test.ts
│   ├── similarity/
│   │   ├── HighFreqEmbedder.test.ts
│   │   ├── CharLevelEmbedder.test.ts
│   │   └── SimilarityEngine.test.ts
│   └── game/
│       ├── WordBank.test.ts
│       └── GameEngine.test.ts
└── styles/
    └── main.css
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "guess-word-game",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "generate-data": "tsx src/data/generateMockData.ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "jsdom": "^24.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>猜词游戏 GuessWordGame</title>
  <link rel="stylesheet" href="/styles/main.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/types.ts**

```typescript
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

export interface SimilarityResult {
  similarity: number;
  method: 'exact' | 'highfreq' | 'charlevel' | 'unknown';
}
```

- [ ] **Step 6: Create src/main.ts (stub)**

```typescript
import { App } from './ui/App.js';

const app = new App(document.getElementById('app')!);
app.init();
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/main.ts src/types.ts
git commit -m "chore: project scaffolding with vite + ts"
```

---

### Task 2: Utility Functions

**Files:**
- Create: `src/utils/textNormalize.ts`
- Create: `src/utils/cosineSimilarity.ts`
- Create: `tests/utils/textNormalize.test.ts`
- Create: `tests/utils/cosineSimilarity.test.ts`

- [ ] **Step 1: Write failing test for textNormalize**

Create `tests/utils/textNormalize.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeText, splitChars, toHalfwidth } from '../../src/utils/textNormalize.js';

describe('normalizeText', () => {
  it('trims whitespace', () => {
    expect(normalizeText('  桌子  ')).toBe('桌子');
  });

  it('removes punctuation', () => {
    expect(normalizeText('桌子！')).toBe('桌子');
    expect(normalizeText('hello, world!')).toBe('hello world');
  });

  it('removes duplicate chars', () => {
    expect(normalizeText('开开开开心')).toBe('开心');
  });
});

describe('splitChars', () => {
  it('splits CJK into individual chars', () => {
    expect(splitChars('桌子')).toEqual(['桌', '子']);
  });

  it('handles mixed input', () => {
    expect(splitChars('a桌子b')).toEqual(['a', '桌', '子', 'b']);
  });
});
```

Run: `npx vitest run tests/utils/textNormalize.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 2: Implement textNormalize.ts**

Create `src/utils/textNormalize.ts`:

```typescript
const PUNCTUATION_REGEX = /[\p{P}\p{S}]+/gu;

export function normalizeText(input: string): string {
  let s = input.trim();
  s = s.replace(PUNCTUATION_REGEX, '');
  s = removeConsecutiveDuplicates(s);
  return s;
}

export function toHalfwidth(input: string): string {
  return input.replace(/[！-～]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

export function splitChars(input: string): string[] {
  return Array.from(input);
}

function removeConsecutiveDuplicates(input: string): string {
  let result = '';
  for (const char of input) {
    if (result.length === 0 || result[result.length - 1] !== char) {
      result += char;
    }
  }
  return result;
}
```

- [ ] **Step 3: Run textNormalize tests**

Run: `npx vitest run tests/utils/textNormalize.test.ts`
Expected: PASS.

- [ ] **Step 4: Write failing test for cosineSimilarity**

Create `tests/utils/cosineSimilarity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cosineSimilarity, magnitude, averageVectors } from '../../src/utils/cosineSimilarity.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('handles zero vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('averageVectors', () => {
  it('averages two vectors', () => {
    expect(averageVectors([[2, 4], [4, 8]])).toEqual([3, 6]);
  });

  it('returns empty array for empty input', () => {
    expect(averageVectors([])).toEqual([]);
  });
});
```

Run: `npx vitest run tests/utils/cosineSimilarity.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement cosineSimilarity.ts**

Create `src/utils/cosineSimilarity.ts`:

```typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;

  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot / (magA * magB);
}

export function magnitude(v: number[]): number {
  let sum = 0;
  for (const x of v) {
    sum += x * x;
  }
  return Math.sqrt(sum);
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const result = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      result[i] += v[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    result[i] /= vectors.length;
  }
  return result;
}
```

- [ ] **Step 6: Run cosineSimilarity tests**

Run: `npx vitest run tests/utils/cosineSimilarity.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/utils tests/utils
git commit -m "feat: add text normalization and cosine similarity utilities with tests"
```

---

### Task 3: Mock Data Generation

**Files:**
- Create: `src/data/generateMockData.ts`
- Create: `public/word-bank.json`
- Create: `public/char-vectors.json`
- Create: `public/highfreq-vectors.json`

Goal: Produce a playable demo dataset with 30 words and semantically-clustered vectors so similarity scores are meaningful without downloading large pretrained models.

- [ ] **Step 1: Write the generation script**

Create `src/data/generateMockData.ts`:

```typescript
import { writeFileSync } from 'fs';
import { join } from 'path';

const DIM = 64;

interface WordEntry {
  word: string;
  category: string;
  difficulty: number;
}

const categories: Record<string, { center: number[]; words: string[] }> = {
  情感: {
    center: randomUnitVector(DIM, 0),
    words: ['情绪', '心情', '快乐', '悲伤', '愤怒', '喜悦', '焦虑', '平静'],
  },
  物品: {
    center: randomUnitVector(DIM, 1),
    words: ['桌子', '椅子', '手机', '电脑', '书本', '杯子', '窗户', '门'],
  },
  自然: {
    center: randomUnitVector(DIM, 2),
    words: ['天空', '大海', '森林', '河流', '山峰', '云朵', '花朵', '太阳'],
  },
  动作: {
    center: randomUnitVector(DIM, 3),
    words: ['奔跑', '跳跃', '思考', '阅读', '写作', '歌唱', '游泳', '飞翔'],
  },
  食物: {
    center: randomUnitVector(DIM, 4),
    words: ['米饭', '面条', '水果', '蔬菜', '饺子', '面包', '咖啡', '茶'],
  },
};

function randomUnitVector(dim: number, seed: number): number[] {
  const v: number[] = [];
  let sum = 0;
  for (let i = 0; i < dim; i++) {
    const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const val = x - Math.floor(x);
    v.push(val);
    sum += val * val;
  }
  const mag = Math.sqrt(sum);
  return v.map((x) => x / mag);
}

function addNoise(center: number[], magnitude: number): number[] {
  const noise = randomUnitVector(center.length, Math.random() * 10000);
  return center.map((c, i) => c + noise[i] * magnitude);
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (mag === 0) return v;
  return v.map((x) => x / mag);
}

// Build word-bank
const wordBank: WordEntry[] = [];
const highFreqVectors: Record<string, number[]> = {};
let diff = 1;

for (const [cat, data] of Object.entries(categories)) {
  for (const word of data.words) {
    wordBank.push({ word, category: cat, difficulty: diff });
    highFreqVectors[word] = normalize(addNoise(data.center, 0.15));
  }
  diff++;
}

// Build char vectors by averaging word vectors for each character
const charAcc: Record<string, number[][]> = {};
for (const [word, vec] of Object.entries(highFreqVectors)) {
  for (const ch of word) {
    if (!charAcc[ch]) charAcc[ch] = [];
    charAcc[ch].push(vec);
  }
}

const charVectors: Record<string, number[]> = {};
for (const [ch, vecs] of Object.entries(charAcc)) {
  const avg = new Array(DIM).fill(0);
  for (const v of vecs) {
    for (let i = 0; i < DIM; i++) avg[i] += v[i];
  }
  for (let i = 0; i < DIM; i++) avg[i] /= vecs.length;
  charVectors[ch] = normalize(avg);
}

// Ensure common chars not in words have a fallback
const extraChars = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感';
for (const ch of extraChars) {
  if (!charVectors[ch]) {
    charVectors[ch] = normalize(randomUnitVector(DIM, ch.charCodeAt(0)));
  }
}

const outDir = join(process.cwd(), 'public');
writeFileSync(join(outDir, 'word-bank.json'), JSON.stringify(wordBank, null, 2));
writeFileSync(join(outDir, 'highfreq-vectors.json'), JSON.stringify(highFreqVectors));
writeFileSync(join(outDir, 'char-vectors.json'), JSON.stringify(charVectors));

console.log(`Generated ${wordBank.length} words, ${Object.keys(charVectors).length} chars`);
```

- [ ] **Step 2: Run the generation script**

Run: `npm run generate-data`
Expected: Console outputs generated counts; three JSON files appear in `public/`.

- [ ] **Step 3: Verify JSON structure manually**

Run: `node -e "const wb=require('./public/word-bank.json'); console.log(wb[0]);"`
Expected: `{ word: '情绪', category: '情感', difficulty: 1 }`

- [ ] **Step 4: Commit**

```bash
git add src/data/generateMockData.ts public/word-bank.json public/char-vectors.json public/highfreq-vectors.json
git commit -m "feat: add mock vector data generation script and demo dataset"
```

---

### Task 4: Similarity Engine

**Files:**
- Create: `src/similarity/HighFreqEmbedder.ts`
- Create: `src/similarity/CharLevelEmbedder.ts`
- Create: `src/similarity/SimilarityEngine.ts`
- Create: `tests/similarity/HighFreqEmbedder.test.ts`
- Create: `tests/similarity/CharLevelEmbedder.test.ts`
- Create: `tests/similarity/SimilarityEngine.test.ts`

- [ ] **Step 1: Write failing test for HighFreqEmbedder**

Create `tests/similarity/HighFreqEmbedder.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { HighFreqEmbedder } from '../../src/similarity/HighFreqEmbedder.js';

describe('HighFreqEmbedder', () => {
  let embedder: HighFreqEmbedder;

  beforeAll(async () => {
    embedder = new HighFreqEmbedder();
    await embedder.load('/highfreq-vectors.json');
  });

  it('returns vector for known word', () => {
    const vec = embedder.embed('情绪');
    expect(vec).not.toBeNull();
    expect(vec!.length).toBe(64);
  });

  it('returns null for unknown word', () => {
    const vec = embedder.embed('不存在这个词');
    expect(vec).toBeNull();
  });
});
```

Run: `npx vitest run tests/similarity/HighFreqEmbedder.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement HighFreqEmbedder.ts**

Create `src/similarity/HighFreqEmbedder.ts`:

```typescript
import type { VectorMap } from '../types.js';

export class HighFreqEmbedder {
  private vectors: VectorMap = {};
  private loaded = false;

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    this.vectors = await res.json();
    this.loaded = true;
  }

  embed(word: string): number[] | null {
    if (!this.loaded) return null;
    return this.vectors[word] ?? null;
  }

  has(word: string): boolean {
    return word in this.vectors;
  }
}
```

- [ ] **Step 3: Run HighFreqEmbedder tests**

Run: `npx vitest run tests/similarity/HighFreqEmbedder.test.ts`
Expected: PASS.

- [ ] **Step 4: Write failing test for CharLevelEmbedder**

Create `tests/similarity/CharLevelEmbedder.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { CharLevelEmbedder } from '../../src/similarity/CharLevelEmbedder.js';

describe('CharLevelEmbedder', () => {
  let embedder: CharLevelEmbedder;

  beforeAll(async () => {
    embedder = new CharLevelEmbedder();
    await embedder.load('/char-vectors.json');
  });

  it('returns vector for known chars', () => {
    const vec = embedder.embed('桌子');
    expect(vec).not.toBeNull();
    expect(vec!.length).toBe(64);
  });

  it('returns null when most chars are unknown', () => {
    const vec = embedder.embed('𠮷𠮷');
    expect(vec).toBeNull();
  });

  it('ignores unknown chars and averages known ones', () => {
    const vec = embedder.embed('桌𠮷');
    expect(vec).not.toBeNull();
    expect(vec!.length).toBe(64);
  });
});
```

Run: `npx vitest run tests/similarity/CharLevelEmbedder.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement CharLevelEmbedder.ts**

Create `src/similarity/CharLevelEmbedder.ts`:

```typescript
import { averageVectors } from '../utils/cosineSimilarity.js';
import { splitChars } from '../utils/textNormalize.js';
import type { VectorMap } from '../types.js';

export class CharLevelEmbedder {
  private vectors: VectorMap = {};
  private loaded = false;

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    this.vectors = await res.json();
    this.loaded = true;
  }

  embed(word: string): number[] | null {
    if (!this.loaded) return null;
    const chars = splitChars(word);
    const known: number[][] = [];
    for (const ch of chars) {
      const vec = this.vectors[ch];
      if (vec) known.push(vec);
    }
    if (known.length === 0) return null;
    if (known.length / chars.length < 0.5) return null;
    return averageVectors(known);
  }
}
```

- [ ] **Step 6: Run CharLevelEmbedder tests**

Run: `npx vitest run tests/similarity/CharLevelEmbedder.test.ts`
Expected: PASS.

- [ ] **Step 7: Write failing test for SimilarityEngine**

Create `tests/similarity/SimilarityEngine.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { SimilarityEngine } from '../../src/similarity/SimilarityEngine.js';

describe('SimilarityEngine', () => {
  let engine: SimilarityEngine;

  beforeAll(async () => {
    engine = new SimilarityEngine();
    await engine.init();
  });

  it('returns exact match for identical words', () => {
    const result = engine.compare('情绪', '情绪');
    expect(result.similarity).toBe(1);
    expect(result.method).toBe('exact');
  });

  it('returns high similarity for related words in same category', () => {
    const result = engine.compare('情绪', '心情');
    expect(result.similarity).toBeGreaterThan(0.5);
    expect(result.method).toBe('highfreq');
  });

  it('returns low similarity for unrelated words', () => {
    const result = engine.compare('情绪', '金');
    expect(result.similarity).toBeLessThan(0.3);
    expect(result.method).toBe('charlevel');
  });

  it('returns 0 for completely unknown input', () => {
    const result = engine.compare('情绪', '𠮷𠮷𠮷');
    expect(result.similarity).toBe(0);
    expect(result.method).toBe('unknown');
  });
});
```

Run: `npx vitest run tests/similarity/SimilarityEngine.test.ts`
Expected: FAIL.

- [ ] **Step 8: Implement SimilarityEngine.ts**

Create `src/similarity/SimilarityEngine.ts`:

```typescript
import { HighFreqEmbedder } from './HighFreqEmbedder.js';
import { CharLevelEmbedder } from './CharLevelEmbedder.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';
import { normalizeText } from '../utils/textNormalize.js';
import type { SimilarityResult } from '../types.js';

export class SimilarityEngine {
  private highFreq = new HighFreqEmbedder();
  private charLevel = new CharLevelEmbedder();

  async init(): Promise<void> {
    await Promise.all([
      this.highFreq.load('/highfreq-vectors.json'),
      this.charLevel.load('/char-vectors.json'),
    ]);
  }

  compare(target: string, guess: string): SimilarityResult {
    const t = normalizeText(target);
    const g = normalizeText(guess);

    if (t === g) {
      return { similarity: 1, method: 'exact' };
    }

    // Level 1: high-frequency exact vectors
    const tVec = this.highFreq.embed(t);
    const gVec = this.highFreq.embed(g);
    if (tVec && gVec) {
      const sim = cosineSimilarity(tVec, gVec);
      return { similarity: Math.max(0, sim), method: 'highfreq' };
    }

    // Level 2: char-level fallback
    const tChar = this.charLevel.embed(t);
    const gChar = this.charLevel.embed(g);
    if (tChar && gChar) {
      const sim = cosineSimilarity(tChar, gChar);
      return { similarity: Math.max(0, sim), method: 'charlevel' };
    }

    return { similarity: 0, method: 'unknown' };
  }
}
```

- [ ] **Step 9: Run SimilarityEngine tests**

Run: `npx vitest run tests/similarity/SimilarityEngine.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/similarity tests/similarity
git commit -m "feat: add similarity engine with highfreq + charlevel fallback and tests"
```

---

### Task 5: Game Core Logic

**Files:**
- Create: `src/game/WordBank.ts`
- Create: `src/game/Scoring.ts`
- Create: `src/game/GameEngine.ts`
- Create: `tests/game/WordBank.test.ts`
- Create: `tests/game/GameEngine.test.ts`

- [ ] **Step 1: Write failing test for WordBank**

Create `tests/game/WordBank.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { WordBank } from '../../src/game/WordBank.js';

describe('WordBank', () => {
  let bank: WordBank;

  beforeAll(async () => {
    bank = new WordBank();
    await bank.load('/word-bank.json');
  });

  it('loads words', () => {
    expect(bank.getAll().length).toBeGreaterThan(0);
  });

  it('returns a random word', () => {
    const word = bank.pickRandom();
    expect(word).not.toBeNull();
    expect(word!.word).toBeTruthy();
  });

  it('does not repeat recently used words', () => {
    const w1 = bank.pickRandom();
    bank.markUsed(w1!.word);
    const w2 = bank.pickRandom([w1!.word]);
    expect(w2!.word).not.toBe(w1!.word);
  });
});
```

Run: `npx vitest run tests/game/WordBank.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement WordBank.ts**

Create `src/game/WordBank.ts`:

```typescript
import type { WordEntry } from '../types.js';

export class WordBank {
  private words: WordEntry[] = [];

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    this.words = await res.json();
  }

  getAll(): WordEntry[] {
    return this.words;
  }

  pickRandom(exclude: string[] = []): WordEntry | null {
    const pool = this.words.filter((w) => !exclude.includes(w.word));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  markUsed(word: string): void {
    // No-op; tracking is done by consumer (GameEngine / localStorage)
  }
}
```

- [ ] **Step 3: Run WordBank tests**

Run: `npx vitest run tests/game/WordBank.test.ts`
Expected: PASS.

- [ ] **Step 4: Write failing test for GameEngine**

Create `tests/game/GameEngine.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { GameEngine } from '../../src/game/GameEngine.js';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeAll(async () => {
    engine = new GameEngine();
    await engine.init();
  });

  beforeEach(() => {
    engine.startNewGame();
  });

  it('starts in playing state', () => {
    expect(engine.getState().status).toBe('playing');
    expect(engine.getState().targetWord).toBeTruthy();
  });

  it('registers a guess and updates history', () => {
    const result = engine.makeGuess('心情');
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.method).toBeTruthy();
    expect(engine.getState().guessCount).toBe(1);
    expect(engine.getState().guesses.length).toBe(1);
  });

  it('wins when exact word is guessed', () => {
    const target = engine.getState().targetWord;
    const result = engine.makeGuess(target);
    expect(result.similarity).toBe(1);
    expect(engine.getState().status).toBe('won');
  });

  it('deduplicates repeated guesses', () => {
    engine.makeGuess('心情');
    engine.makeGuess('心情');
    expect(engine.getState().guessCount).toBe(1);
  });

  it('tracks best score', () => {
    engine.makeGuess('金');
    const s1 = engine.getState().bestScore;
    engine.makeGuess('心情');
    const s2 = engine.getState().bestScore;
    expect(s2).toBeGreaterThanOrEqual(s1);
  });
});
```

Run: `npx vitest run tests/game/GameEngine.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement Scoring.ts**

Create `src/game/Scoring.ts`:

```typescript
import type { GuessRecord } from '../types.js';

export function rankGuesses(guesses: GuessRecord[]): GuessRecord[] {
  const sorted = [...guesses].sort((a, b) => b.similarity - a.similarity);
  return sorted.map((g, i) => ({ ...g, rank: i + 1 }));
}

export function computeStats(guesses: GuessRecord[], startTime: number) {
  const elapsed = Date.now() - startTime;
  return {
    guessCount: guesses.length,
    elapsedMs: elapsed,
    bestSimilarity: guesses.length > 0 ? Math.max(...guesses.map((g) => g.similarity)) : 0,
  };
}
```

- [ ] **Step 6: Implement GameEngine.ts**

Create `src/game/GameEngine.ts`:

```typescript
import { WordBank } from './WordBank.js';
import { Scoring } from './Scoring.js';
import { SimilarityEngine } from '../similarity/SimilarityEngine.js';
import { normalizeText } from '../utils/textNormalize.js';
import type { GameState, GuessRecord, SimilarityResult } from '../types.js';

export class GameEngine {
  private wordBank = new WordBank();
  private similarity = new SimilarityEngine();
  private state: GameState;
  private usedWords: string[] = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      status: 'idle',
      targetWord: '',
      guesses: [],
      guessCount: 0,
      startTime: 0,
      bestScore: 0,
      hintUsed: false,
    };
  }

  async init(): Promise<void> {
    await Promise.all([this.wordBank.load('/word-bank.json'), this.similarity.init()]);
    this.state.status = 'idle';
  }

  startNewGame(): void {
    const entry = this.wordBank.pickRandom(this.usedWords);
    if (!entry) {
      this.usedWords = [];
      this.startNewGame();
      return;
    }
    this.usedWords.push(entry.word);
    this.state = {
      status: 'playing',
      targetWord: entry.word,
      guesses: [],
      guessCount: 0,
      startTime: Date.now(),
      bestScore: 0,
      hintUsed: false,
    };
  }

  makeGuess(rawInput: string): SimilarityResult {
    if (this.state.status !== 'playing') {
      return { similarity: 0, method: 'unknown' };
    }
    const input = normalizeText(rawInput);
    if (!input) return { similarity: 0, method: 'unknown' };

    const existing = this.state.guesses.find((g) => normalizeText(g.word) === input);
    if (existing) {
      return { similarity: existing.similarity, method: 'exact' };
    }

    const result = this.similarity.compare(this.state.targetWord, input);
    const record: GuessRecord = {
      word: rawInput,
      similarity: result.similarity,
      rank: 0,
      timestamp: Date.now(),
    };
    this.state.guesses.push(record);
    this.state.guessCount++;
    if (result.similarity > this.state.bestScore) {
      this.state.bestScore = result.similarity;
    }
    if (input === normalizeText(this.state.targetWord)) {
      this.state.status = 'won';
    }
    // Re-rank
    this.state.guesses = Scoring.rankGuesses(this.state.guesses);
    return result;
  }

  useHint(): string | null {
    if (this.state.hintUsed || this.state.status !== 'playing') return null;
    const entry = this.wordBank.getAll().find((w) => w.word === this.state.targetWord);
    if (!entry) return null;
    this.state.hintUsed = true;
    return entry.category;
  }

  getState(): GameState {
    return { ...this.state, guesses: [...this.state.guesses] };
  }
}
```

- [ ] **Step 7: Run GameEngine tests**

Run: `npx vitest run tests/game/GameEngine.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/game tests/game
git commit -m "feat: add game engine with word bank, scoring, and guess flow + tests"
```

---

### Task 6: UI Components — Input & History

**Files:**
- Create: `src/ui/GuessInput.ts`
- Create: `src/ui/GuessHistory.ts`
- Modify: `styles/main.css` (partial)

- [ ] **Step 1: Create GuessInput.ts**

Create `src/ui/GuessInput.ts`:

```typescript
export class GuessInput {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private button: HTMLButtonElement;
  private onSubmit?: (value: string) => void;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'guess-input';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = '输入你的猜测...';
    this.input.autocomplete = 'off';

    this.button = document.createElement('button');
    this.button.textContent = '猜测';

    this.root.append(this.input, this.button);
    parent.appendChild(this.root);

    this.button.addEventListener('click', () => this.submit());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
  }

  private submit(): void {
    const value = this.input.value.trim();
    if (value && this.onSubmit) {
      this.onSubmit(value);
      this.input.value = '';
    }
  }

  setOnSubmit(fn: (value: string) => void): void {
    this.onSubmit = fn;
  }

  focus(): void {
    this.input.focus();
  }

  destroy(): void {
    this.root.remove();
  }
}
```

- [ ] **Step 2: Create GuessHistory.ts**

Create `src/ui/GuessHistory.ts`:

```typescript
import type { GuessRecord } from '../types.js';

export class GuessHistory {
  private root: HTMLElement;
  private list: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'guess-history';

    const title = document.createElement('h3');
    title.textContent = '猜测历史';

    this.list = document.createElement('ul');
    this.list.className = 'guess-list';

    this.root.append(title, this.list);
    parent.appendChild(this.root);
  }

  render(guesses: GuessRecord[]): void {
    this.list.innerHTML = '';
    const sorted = [...guesses].sort((a, b) => b.similarity - a.similarity);
    for (const g of sorted) {
      const li = document.createElement('li');
      li.className = 'guess-item';
      const pct = (g.similarity * 100).toFixed(1);
      const tempClass = this.tempClass(g.similarity);
      li.innerHTML = `
        <span class="guess-word">${this.escapeHtml(g.word)}</span>
        <span class="guess-sim ${tempClass}">${pct}%</span>
      `;
      this.list.appendChild(li);
    }
  }

  private tempClass(sim: number): string {
    if (sim >= 0.8) return 'hot';
    if (sim >= 0.3) return 'warm';
    return 'cold';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy(): void {
    this.root.remove();
  }
}
```

- [ ] **Step 3: Add base CSS for input and history**

Create or modify `styles/main.css` (add these rules):

```css
.guess-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.guess-input input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
}

.guess-input button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.guess-history {
  margin-top: 1rem;
}

.guess-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.guess-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #eee;
}

.guess-sim.hot { color: #ef4444; font-weight: 700; }
.guess-sim.warm { color: #f59e0b; }
.guess-sim.cold { color: #3b82f6; }
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Open browser at `http://localhost:5173`
Expected: Page loads without errors (currently mostly blank except eventual app mount point).

- [ ] **Step 5: Commit**

```bash
git add src/ui/GuessInput.ts src/ui/GuessHistory.ts styles/main.css
git commit -m "feat: add guess input and history UI components with styles"
```

---

### Task 7: UI Components — App Shell & Result Panel

**Files:**
- Create: `src/ui/ResultPanel.ts`
- Create: `src/ui/App.ts`
- Modify: `src/main.ts`
- Modify: `styles/main.css`

- [ ] **Step 1: Create ResultPanel.ts**

Create `src/ui/ResultPanel.ts`:

```typescript
import type { GameState } from '../types.js';

export class ResultPanel {
  private root: HTMLElement;
  private similarityBar: HTMLElement;
  private similarityText: HTMLElement;
  private targetReveal: HTMLElement;
  private actionArea: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'result-panel';

    this.similarityBar = document.createElement('div');
    this.similarityBar.className = 'similarity-bar';
    this.similarityBar.innerHTML = '<div class="similarity-fill"></div>';

    this.similarityText = document.createElement('div');
    this.similarityText.className = 'similarity-text';

    this.targetReveal = document.createElement('div');
    this.targetReveal.className = 'target-reveal';

    this.actionArea = document.createElement('div');
    this.actionArea.className = 'action-area';

    this.root.append(this.similarityText, this.similarityBar, this.targetReveal, this.actionArea);
    parent.appendChild(this.root);
  }

  showLatest(similarity: number): void {
    const pct = (similarity * 100).toFixed(1);
    this.similarityText.textContent = `关联度: ${pct}%`;
    const fill = this.similarityBar.querySelector('.similarity-fill') as HTMLElement;
    if (fill) fill.style.width = `${Math.min(100, similarity * 100)}%`;
  }

  showWin(state: GameState): void {
    this.targetReveal.textContent = `目标词: ${state.targetWord}`;
    this.targetReveal.classList.add('won');
    this.actionArea.innerHTML = `
      <p>用了 ${state.guessCount} 次，耗时 ${this.formatTime(Date.now() - state.startTime)}</p>
      <button id="btn-next">再来一局</button>
    `;
  }

  showIdle(onStart: () => void): void {
    this.actionArea.innerHTML = '<button id="btn-start">开始游戏</button>';
    this.actionArea.querySelector('#btn-start')?.addEventListener('click', onStart);
  }

  onNextGame(fn: () => void): void {
    this.actionArea.querySelector('#btn-next')?.addEventListener('click', fn);
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${s} 秒`;
  }

  destroy(): void {
    this.root.remove();
  }
}
```

- [ ] **Step 2: Create App.ts**

Create `src/ui/App.ts`:

```typescript
import { GameEngine } from '../game/GameEngine.js';
import { GuessInput } from './GuessInput.js';
import { GuessHistory } from './GuessHistory.js';
import { ResultPanel } from './ResultPanel.js';

export class App {
  private container: HTMLElement;
  private engine: GameEngine;
  private input?: GuessInput;
  private history?: GuessHistory;
  private result?: ResultPanel;

  constructor(container: HTMLElement) {
    this.container = container;
    this.engine = new GameEngine();
  }

  async init(): Promise<void> {
    this.container.innerHTML = '<div class="loading">加载中...</div>';
    await this.engine.init();
    this.container.innerHTML = '';
    this.showIdle();
  }

  private showIdle(): void {
    this.container.innerHTML = '<h1>猜词游戏</h1>';
    this.result = new ResultPanel(this.container);
    this.result.showIdle(() => this.startGame());
  }

  private startGame(): void {
    this.engine.startNewGame();
    this.container.innerHTML = '<h1>猜词游戏</h1>';

    const gameArea = document.createElement('div');
    gameArea.className = 'game-area';
    this.container.appendChild(gameArea);

    this.result = new ResultPanel(gameArea);
    this.result.showLatest(0);

    this.input = new GuessInput(gameArea);
    this.input.setOnSubmit((val) => this.handleGuess(val));
    this.input.focus();

    this.history = new GuessHistory(gameArea);

    const controls = document.createElement('div');
    controls.className = 'game-controls';
    controls.innerHTML = `
      <button id="btn-hint">给点提示</button>
      <button id="btn-skip">换一个新词</button>
    `;
    gameArea.appendChild(controls);

    controls.querySelector('#btn-hint')?.addEventListener('click', () => this.showHint());
    controls.querySelector('#btn-skip')?.addEventListener('click', () => this.startGame());
  }

  private handleGuess(value: string): void {
    const result = this.engine.makeGuess(value);
    this.result?.showLatest(result.similarity);
    this.history?.render(this.engine.getState().guesses);

    if (this.engine.getState().status === 'won') {
      this.result?.showWin(this.engine.getState());
      this.result?.onNextGame(() => this.startGame());
      this.input?.destroy();
    } else {
      this.input?.focus();
    }
  }

  private showHint(): void {
    const hint = this.engine.useHint();
    if (hint) {
      alert(`提示: 这个词属于「${hint}」类别`);
    }
  }
}
```

- [ ] **Step 3: Update main.ts**

Modify `src/main.ts`:

```typescript
import { App } from './ui/App.js';

const app = new App(document.getElementById('app')!);
app.init();
```

- [ ] **Step 4: Add App-level CSS**

Append to `styles/main.css`:

```css
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f8fafc;
  color: #1e293b;
  margin: 0;
  padding: 1rem;
}

#app {
  max-width: 480px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.game-area {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.result-panel {
  margin-bottom: 1rem;
}

.similarity-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.similarity-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.similarity-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #3b82f6, #ef4444);
  transition: width 0.4s ease;
}

.target-reveal.won {
  margin-top: 0.75rem;
  font-size: 1.25rem;
  color: #059669;
  font-weight: 700;
}

.action-area {
  margin-top: 0.75rem;
  text-align: center;
}

.action-area button,
.game-controls button {
  margin: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.game-controls {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
Open browser at `http://localhost:5173`
Expected:
- "加载中..." shown briefly
- "开始游戏" button appears
- Clicking start shows input + history + controls
- Typing a word and clicking "猜测" shows similarity % and adds to history
- Guessing exact target word shows win state with "再来一局"

- [ ] **Step 6: Commit**

```bash
git add src/ui/App.ts src/ui/ResultPanel.ts src/main.ts styles/main.css
git commit -m "feat: add App shell, result panel, and wire up full game flow"
```

---

### Task 8: Local Storage & Statistics

**Files:**
- Create: `src/game/Storage.ts`
- Create: `tests/game/Storage.test.ts`
- Modify: `src/game/GameEngine.ts`
- Modify: `src/ui/App.ts`

- [ ] **Step 1: Write failing test for Storage**

Create `tests/game/Storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../../src/game/Storage.js';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads stats', () => {
    Storage.saveGameResult({ guessCount: 5, elapsedMs: 12000, targetWord: '情绪' });
    const stats = Storage.loadStats();
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.bestGuessCount).toBe(5);
  });

  it('tracks used words', () => {
    Storage.markWordUsed('桌子');
    expect(Storage.getUsedWords()).toContain('桌子');
  });

  it('returns default stats when empty', () => {
    const stats = Storage.loadStats();
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.bestGuessCount).toBe(Infinity);
  });
});
```

Run: `npx vitest run tests/game/Storage.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement Storage.ts**

Create `src/game/Storage.ts`:

```typescript
const PREFIX = 'gwg_';

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

export class Storage {
  static saveGameResult(result: GameResult): void {
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
    if (!used.includes(result.targetWord)) {
      used.push(result.targetWord);
      localStorage.setItem(`${PREFIX}usedWords`, JSON.stringify(used));
    }
  }

  static loadStats(): PlayerStats {
    const raw = localStorage.getItem(`${PREFIX}stats`);
    if (!raw) {
      return { gamesPlayed: 0, totalGuesses: 0, bestGuessCount: Infinity, bestTimeMs: 0 };
    }
    return JSON.parse(raw);
  }

  static getUsedWords(): string[] {
    const raw = localStorage.getItem(`${PREFIX}usedWords`);
    return raw ? JSON.parse(raw) : [];
  }

  static markWordUsed(word: string): void {
    const used = this.getUsedWords();
    if (!used.includes(word)) {
      used.push(word);
      localStorage.setItem(`${PREFIX}usedWords`, JSON.stringify(used));
    }
  }

  static clear(): void {
    localStorage.removeItem(`${PREFIX}stats`);
    localStorage.removeItem(`${PREFIX}usedWords`);
  }
}
```

- [ ] **Step 3: Run Storage tests**

Run: `npx vitest run tests/game/Storage.test.ts`
Expected: PASS.

- [ ] **Step 4: Integrate Storage into GameEngine**

Modify `src/game/GameEngine.ts`:
- Add import: `import { Storage } from './Storage.js';`
- In `startNewGame`, replace `this.usedWords` initialization with:
  ```typescript
  this.usedWords = Storage.getUsedWords();
  ```
- Add method `saveResult()`:
  ```typescript
  saveResult(): void {
    if (this.state.status !== 'won') return;
    Storage.saveGameResult({
      guessCount: this.state.guessCount,
      elapsedMs: Date.now() - this.state.startTime,
      targetWord: this.state.targetWord,
    });
  }
  ```

- [ ] **Step 5: Integrate into App.ts**

Modify `src/ui/App.ts`:
- Add import: `import { Storage } from '../game/Storage.js';`
- In `handleGuess`, after win detection:
  ```typescript
  if (this.engine.getState().status === 'won') {
    this.engine.saveResult();
    // ... existing win UI code
  }
  ```
- In `showIdle`, display stats:
  ```typescript
  private showIdle(): void {
    this.container.innerHTML = '<h1>猜词游戏</h1>';
    const stats = Storage.loadStats();
    const statsEl = document.createElement('div');
    statsEl.className = 'stats-summary';
    statsEl.innerHTML = stats.gamesPlayed > 0
      ? `<p>已玩 ${stats.gamesPlayed} 局 | 最佳: ${stats.bestGuessCount} 次猜中</p>`
      : '<p>欢迎来到猜词游戏！</p>';
    this.container.appendChild(statsEl);
    this.result = new ResultPanel(this.container);
    this.result.showIdle(() => this.startGame());
  }
  ```

- [ ] **Step 6: Add stats CSS**

Append to `styles/main.css`:

```css
.stats-summary {
  text-align: center;
  color: #475569;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`
Expected:
- Stats display on idle screen after winning a game
- Refreshing page preserves used-word list (new games avoid recently used words)

- [ ] **Step 8: Commit**

```bash
git add src/game/Storage.ts tests/game/Storage.test.ts src/game/GameEngine.ts src/ui/App.ts styles/main.css
git commit -m "feat: add localStorage persistence for stats and used-word tracking"
```

---

### Task 9: Build Verification & Polish

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json` (scripts)
- Modify: `index.html` (meta tags)

- [ ] **Step 1: Update vite.config.ts for production**

Modify `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 2: Update index.html with meta tags**

Modify `index.html` `<head>` to include:

```html
<meta name="description" content="中文语义猜词游戏 - 输入任意词汇，探索语义关联度">
<meta name="theme-color" content="#4f46e5">
```

- [ ] **Step 3: Add build and preview scripts verification**

Run: `npm run build`
Expected: `dist/` directory created with `index.html`, assets, and copied `public/` JSON files.

Run: `npm run preview`
Open browser at printed URL.
Expected: Game loads and plays identically to dev mode.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html package.json
git commit -m "chore: configure production build and verify end-to-end"
```

---

## Self-Review

**1. Spec coverage:**
- Core gameplay (guess → similarity → win): Task 4, 5, 7
- Arbitrary input coverage: Task 4 (char-level fallback)
- History panel with temperature colors: Task 6
- Hint system: Task 5 (GameEngine.useHint)
- Local storage / stats: Task 8
- Responsive UI: Task 6-7 CSS
- Performance (static JSON, no model download): Task 3, 4
- Build & deploy: Task 9
- **Gap identified:** No dedicated mobile viewport CSS beyond basic padding. Added `max-width: 480px` and touch-friendly buttons in Task 7 CSS — sufficient for MVP.

**2. Placeholder scan:**
- No "TBD", "TODO", "implement later" found.
- All steps include exact file paths, code blocks, and commands.
- Test steps precede implementation steps (TDD).

**3. Type consistency:**
- `SimilarityResult.method` uses `'exact' | 'highfreq' | 'charlevel' | 'unknown'` consistently across Task 4 tests and implementation.
- `GameState.status` uses `'loading' | 'idle' | 'playing' | 'won'` consistently.
- `VectorMap` used in both embedders and `types.ts`.
- No naming mismatches detected.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-03-guess-word-game.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints for review

**Which approach?**
