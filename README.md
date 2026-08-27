# Quant Interview 题库 (Quant Interview Question Bank)

一款基于三本 PDF 扫描书 OCR + 中文化整理的**纯前端**量化面试题库页。

- **635 题**，覆盖脑经急转弯、概率、统计、随机过程、微积分、计量金融、估值、脑筋急转弯等
- **三段式答案**（📌 原题 / 📝 参考解答 / 💡 关键思路），参照主流出题机构（红宝书 / 绿宝书 / 投行 400 题 / Heard on the Street / Glassdoor）的展现方式
- 内置**来源筛选**（绿宝书 / 红宝书 / 黄皮书 / Heard on the Street）、**难度筛选**、**关键词搜索**、**🎯 测试模式**（自测掌握度，本地 localStorage 持久化）

## 在线访问

部署链接：https://c2b02f1d031c4c3d9e8c854b86074171.app.workbuddy.link
（修改后若页面没刷新，请 `Ctrl/Cmd + Shift + R` 硬刷新。）

## 文件说明

| 文件 | 说明 |
| --- | --- |
| `index.html` | **主交付物**：单文件题库页，含全部 635 题与三段式渲染逻辑 |
| `questions_full.json` | 数据源（635 题全集，英文原文） |
| `trans_v2_00..15.json` | 16 批中译稿（与 `questions_full.json` 按 id 对齐后写入 `index.html`） |
| `merge.js` | `trans_v2_*.json` → `index.html` 的合并脚本 |
| `restore_solutions.js` | 从 `questions_full.json` 补回被 OCR 误吞的「参考解答」 |
| `do_trans.py` / `build_trans.py` / `ocr_all.py` | 中文翻译 + OCR 流水线脚本 |
| `split_full.js` / `validate.js` | 题面切分 / 答案块校验 |

## 本地预览

直接双击 `index.html` 用浏览器打开即可（无需后端、无需联网）。

## 重新构建

```bash
# 1. 用 trans_v2_*.json + questions_full.json 重新生成 index.html
node merge.js

# 2. 校验 splitAnswer 渲染是否正常
node validate.js
```

## 数据来源

- 绿宝书 / 红宝书 / 黄皮书（中文三大主流量化面试书）扫描版 OCR
- [SoYuCry/awesome-quant-interview](https://github.com/SoYuCry/awesome-quant-interview)（题目清单与原书结构）
- Heard on the Street（第 9 版；`hots_*` OCR 暂未回填）

## License

仅作学习交流使用。
