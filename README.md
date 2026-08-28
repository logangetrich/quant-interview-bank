# 量化面试题单页题库 (Quant Interview Bank)

**3921 道量化金融面试题**：四大经典宝典（绿宝书/红宝书/黄皮书/Heard on the Street）635 题 + QuantVault 索引 3286 题（AI 按需生成解答）。

## 功能

- 🎯 **测试模式**：20 题随机抽题 · 5 星自信度 · 答题后对比评估（低估/高估/准确）· 7 维雷达图 · 键盘快捷键
- 🔍 **探索页**（explore.html）：15 个策展 playlist（必刷 100 / QT 路径 / 概率专题 / 入门 50 / 每日 5 题等）
- ✨ **AI 无限模式**（需本地）：变体出题 / 即时解答 / 模拟面试 —— 基于 llmx.tqx.ai
- 📊 **学习追踪**：掌握/不会/已看状态 · 连续天数 · 错题本 · 重练错题
- 📱 **响应式**：桌面三栏 / 移动单栏

## 快速开始

### 在线版（GitHub Pages）
直接访问 https://logangetrich.github.io/quant-interview-bank/
（AI 功能需本地启动 llm_server.js 才能用）

### 本地版（含 AI 功能）
```bash
# 1. 启动 LLM 代理（AI 出题/解答/模拟面试）
node llm_server.js 8787

# 2. 打开 index.html（或浏览器访问 localhost 静态服务）
```

## 数据文件

- `index.html` — 单文件应用（3921 题内嵌，首屏 50 题分页加载）
- `explore.html` — 策展清单发现页
- `questions_all.json` — 3921 题数据源（可复用）
- `playlists.json` — 15 个策展 playlist 定义
- `llm_server.js` — LLM 本地代理（读 `.llmx_key` 或 `LLMX_KEY` 环境变量）
