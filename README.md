# 猜词游戏 GuessWordGame

> 纯前端中文语义猜词游戏 · 多级 Fallback 相似度计算 · 零后端部署

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff)
![Vitest](https://img.shields.io/badge/Vitest-2.1-6e9f18)
![License](https://img.shields.io/badge/license-MIT-green)

一个可在 GitHub Pages / 任意静态服务器直接部署的中文语义猜词游戏。玩家通过不断输入词语并获取"与目标词的语义相似度"反馈来缩小猜测范围，直到命中目标。相似度完全在浏览器本地计算，**无需服务器、无需 API Key、无外部请求**。

---

## ✨ 特性

- **三级 Fallback 相似度引擎**：高频词向量 → 字符级向量平均 → 未知降级，任何输入都能给出反馈
- **纯前端离线运行**：全部资源静态化，首屏 JS < 20 KB（gzip 后 < 6 KB），向量数据惰性加载
- **本地战绩持久化**：使用 `localStorage` 存储最佳猜测次数、总局数、最近 30 个已用目标词
- **冷热色可视化**：4 档分级（冰凉 / 偏凉 / 偏热 / 炙热）直观展示接近程度
- **暗色模式 & 响应式**：自动跟随 `prefers-color-scheme`，移动端良好适配
- **零运行时依赖**：生产产物只有 HTML/CSS/JS/JSON，便于部署到任何 CDN

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18（推荐 20 LTS 或 22）
- TypeScript 需 **全局安装**（本项目不将其作为 devDependency）：
  ```bash
  npm i -g typescript
  ```

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 生成向量数据（首次运行或词库更新后执行）
npm run generate-data

# 3. 启动开发服务器（http://localhost:5173）
npm run dev

# 4. 生产构建
npm run build

# 5. 本地预览生产包
npm run preview
```

### 可用脚本

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（HMR） |
| `npm run build` | 生产构建，产物输出到 `dist/` |
| `npm run preview` | 本地预览 `dist/` 产物 |
| `npm run typecheck` | 使用全局 `tsc` 做类型检查（不生成文件） |
| `npm run test` | 运行全部单元测试一次 |
| `npm run test:watch` | 以监听模式运行测试 |
| `npm run generate-data` | 重新生成词库与向量 JSON（基于 Mulberry32 PRNG，结果可复现） |

---

## 🎮 玩法说明

1. 页面加载后会随机抽取一个目标词（不重复已用过的词）。
2. 在输入框中输入任意中文词语，按回车或点击"猜测"按钮。
3. 系统返回一个 0~1 的相似度得分，并用冷热色标示与目标词的接近程度：
   - 🟦 **冰凉 (< 0.3)**：方向不对
   - 🟩 **偏凉 (0.3 ~ 0.6)**：稍有关联
   - 🟧 **偏热 (0.6 ~ 0.85)**：方向对了
   - 🟥 **炙热 (≥ 0.85)**：非常接近
4. 历史记录按相似度自动排序，帮你聚焦最接近的线索。
5. 命中相似度 `1.0` 时游戏胜利，可查看本局耗时与历史最佳。
6. 支持"提示 / 换词 / 放弃"三个操作按钮。

---

## 🧠 核心原理：三级 Fallback 相似度

输入一个词 `guess`，与目标词 `target` 比较时，按以下顺序尝试：

```text
normalizeText(guess) === normalizeText(target)
          │ yes
          ▼
      similarity = 1.0  （exact）

  否则，查高频词向量表（highfreq-vectors.json）
          │ 两词都命中
          ▼
      cosineSimilarity(vec_t, vec_g)  （highfreq）

  否则，拆字后查字符向量表（char-vectors.json），取字符向量平均
          │ 两词都能算出向量
          ▼
      cosineSimilarity(avg_t, avg_g)  （charlevel）

  否则
          ▼
      similarity = 0      （unknown，提示用户换个词）
```

每次返回的结果同时携带命中的 `method` 字段，UI 可据此给出细微提示。

### 为什么这样设计？

- **完全离线**：不依赖大模型 API，向量表只需 ~350 KB，预生成一次即可长期使用
- **永不失败**：哪怕词库里没有这个词，也能用字符级向量给出粗略反馈，不会出现"不认识你的输入"的死路
- **可替换**：实际部署时可以把 `public/highfreq-vectors.json` 替换为真实的 word2vec / fasttext 中文向量，游戏逻辑无需改动

---

## 📁 目录结构

```
GuessWordGame/
├── docs/                     # 设计文档 & 实施计划
├── public/                   # 向量数据 JSON，会被原样复制到 dist/
│   ├── word-bank.json        #   80 个目标词（8 类别 × 10 词）
│   ├── highfreq-vectors.json #   高频词向量（64 维）
│   └── char-vectors.json     #   字符级向量（64 维）
├── src/
│   ├── data/                 # Mock 数据生成脚本（Mulberry32 PRNG）
│   ├── utils/                # textNormalize / cosineSimilarity
│   ├── similarity/           # HighFreqEmbedder / CharLevelEmbedder / SimilarityEngine
│   ├── game/                 # WordBank / Scoring / Storage / GameEngine
│   ├── ui/                   # GuessInput / GuessHistory / ResultPanel / App
│   ├── main.ts               # 入口
│   ├── types.ts              # 共享类型
│   └── env.d.ts              # vite/client 类型声明
├── styles/
│   └── main.css              # 主题变量、冷热色、动画、暗色模式
├── tests/
│   ├── setup.ts              # 浏览器 API 垫片（localStorage）
│   ├── utils/                # 工具函数测试
│   ├── similarity/           # 相似度引擎测试
│   └── game/                 # 游戏核心测试
├── index.html
├── vite.config.ts            # Vite + Vitest 配置
├── tsconfig.json
└── package.json
```

---

## 🧪 测试

```bash
npm test
```

覆盖 8 个测试文件 / 47 个用例：

- `textNormalize` · 归一化、全角转半角、连续重复去除
- `cosineSimilarity` · 余弦相似度边界值与数值稳定性
- `HighFreqEmbedder` / `CharLevelEmbedder` · 向量查询与降级
- `SimilarityEngine` · 三级 Fallback 路径覆盖
- `WordBank` · 词库加载、随机抽词、去重
- `Storage` · 战绩持久化、已用词限额（最近 30 个）
- `GameEngine` · 新局 / 猜测 / 命中 / 保存流程

测试环境为纯 Node（不依赖 jsdom），`tests/setup.ts` 内置了一个 `MemoryStorage` 垫片实现 `localStorage`，避免重量级 DOM 依赖。

---

## 🛠️ 技术栈

| 类别 | 选择 | 备注 |
| --- | --- | --- |
| 语言 | TypeScript 5.x | 仅用全局 `tsc` 做类型检查 |
| 构建 | Vite 5.4 | 生产构建用 esbuild 剥离类型 |
| 测试 | Vitest 2.x | node 环境 + localStorage 垫片 |
| 样式 | 原生 CSS3 | CSS 变量、冷热色动画、`prefers-color-scheme` |
| 框架 | 无 | 纯 DOM + 原生类组件，< 20 KB JS |
| 存储 | localStorage | 前缀 `gwg_`，仅 ~1 KB 占用 |

### 关键构建策略

- `package.json` 中**不包含** `typescript`，依赖用户本地/CI 的全局安装（个人项目精简）
- `build` 脚本是 `vite build`（不跑 `tsc`），类型问题由 IDE 和 `npm run typecheck` 保障
- 向量 JSON 放在 `public/`，由 Vite 自动复制到 `dist/`，运行时 `fetch('./word-bank.json')` 加载

---

## 🌐 部署

产物是完全静态的，以下任一平台开箱即用：

- **GitHub Pages**：`npm run build`，将 `dist/` 内容推到 `gh-pages` 分支
- **Vercel / Netlify**：绑定仓库，构建命令 `npm run build`，输出目录 `dist`
- **任意 Nginx / Apache**：把 `dist/` 作为网站根目录即可

> `vite.config.ts` 已设置 `base: './'`，支持子路径部署（如 `https://user.github.io/GuessWordGame/`）。

---

## 📄 许可证

MIT © 2026 jiangconghu01

---

## 🗺️ 后续规划

- [ ] 接入真实中文词向量（fasttext 300 维压缩版）
- [ ] 分享本局战报（生成图片 / 可回放链接）
- [ ] 每日挑战模式（按日期种子选词）
- [ ] 词库分级（初级 / 中级 / 大神）
- [ ] PWA 离线缓存
