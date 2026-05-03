/**
 * Mock 向量数据生成脚本
 *
 * 通过"类别中心 + 类别内噪声"的方式生成可游玩的语义聚类向量：
 * - 同一类别词向量在向量空间相互靠近（cos > 0.7）
 * - 不同类别词向量大体正交（cos ≈ 0）
 * - 字向量由其所在词的向量平均得到
 *
 * 运行: npm run generate-data
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIM = 64;

interface WordEntry {
  word: string;
  category: string;
  difficulty: number;
}

const categories: Record<string, string[]> = {
  情感: ['情绪', '心情', '快乐', '悲伤', '愤怒', '喜悦', '焦虑', '平静', '感动', '思念'],
  物品: ['桌子', '椅子', '手机', '电脑', '书本', '杯子', '窗户', '钥匙', '雨伞', '钱包'],
  自然: ['天空', '大海', '森林', '河流', '山峰', '云朵', '花朵', '太阳', '月亮', '星星'],
  动作: ['奔跑', '跳跃', '思考', '阅读', '写作', '歌唱', '游泳', '飞翔', '攀登', '舞蹈'],
  食物: ['米饭', '面条', '水果', '蔬菜', '饺子', '面包', '咖啡', '茶水', '蛋糕', '巧克力'],
  动物: ['老虎', '狮子', '兔子', '猫咪', '狗狗', '大象', '海豚', '蝴蝶', '老鹰', '熊猫'],
  时间: ['早晨', '黄昏', '深夜', '春天', '夏天', '秋天', '冬天', '昨天', '明天', '未来'],
  抽象: ['自由', '梦想', '希望', '勇气', '智慧', '真理', '记忆', '孤独', '幸福', '命运']
};

// 简单的可重复 PRNG（Mulberry32），保证每次生成结果一致
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20260503);

function randomVector(dim: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dim; i++) {
    // 高斯近似（Box-Muller 简化版）
    const u = Math.max(rng(), 1e-9);
    const v2 = rng();
    v.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v2));
  }
  return normalize(v);
}

function normalize(v: number[]): number[] {
  const m = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (m === 0) return v;
  return v.map((x) => x / m);
}

function jitter(center: number[], amount: number): number[] {
  const noise = randomVector(center.length);
  return normalize(center.map((c, i) => c + noise[i] * amount));
}

// 1. 为每个类别生成一个中心向量
const centers: Record<string, number[]> = {};
for (const cat of Object.keys(categories)) {
  centers[cat] = randomVector(DIM);
}

// 2. 生成词库 + 高频词向量
const wordBank: WordEntry[] = [];
const highFreqVectors: Record<string, number[]> = {};

let catIndex = 0;
for (const [cat, words] of Object.entries(categories)) {
  const center = centers[cat];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    wordBank.push({
      word: w,
      category: cat,
      difficulty: Math.min(5, 1 + Math.floor(i / 3))
    });
    // 同类别内词向量在中心附近做小幅扰动，保留较高互相相似度
    highFreqVectors[w] = jitter(center, 0.45);
  }
  catIndex++;
}

// 3. 字向量 = 包含此字的所有词向量的归一平均
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

// 4. 为常用汉字补充独立随机向量（避免完全无字向量可查）
const COMMON_CHARS =
  '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感觉光位实见叫党管程组处';
for (const ch of COMMON_CHARS) {
  if (!charVectors[ch]) {
    charVectors[ch] = randomVector(DIM);
  }
}

// 5. 写入文件
const outDir = join(process.cwd(), 'public');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'word-bank.json'), JSON.stringify(wordBank, null, 2), 'utf-8');
writeFileSync(join(outDir, 'highfreq-vectors.json'), JSON.stringify(highFreqVectors), 'utf-8');
writeFileSync(join(outDir, 'char-vectors.json'), JSON.stringify(charVectors), 'utf-8');

// eslint-disable-next-line no-console
console.log(
  `[generateMockData] 词库 ${wordBank.length} 词，高频向量 ${Object.keys(highFreqVectors).length} 项，字向量 ${Object.keys(charVectors).length} 项`
);
