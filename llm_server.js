/**
 * LLM 代理服务 — 供前端安全调用 llmx.tqx.ai
 * 用法: node llm_server.js [端口]   (默认 8787)
 * API:
 *   POST /api/ask   {prompt, system?, model?, maxTokens?}
 *   GET  /api/models
 * Key 从环境变量 LLMX_KEY 或同目录 .llmx_key 文件读取（不进前端、不进代码库）
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.argv[2] || process.env.PORT || 8787);
const BASE = 'https://llmx.tqx.ai/v1';
const DEFAULT_MODEL = 'DeepSeek-V4-flash'; // 便宜快速，适合题库生成

// ---- 读 API Key（环境变量优先，其次本地文件）----
let KEY = process.env.LLMX_KEY || '';
if (!KEY) {
  for (const f of [path.join(__dirname, '.llmx_key'), path.join(__dirname, '..', '.llmx_key')]) {
    try { KEY = fs.readFileSync(f, 'utf8').trim(); if (KEY) break; } catch (e) {}
  }
}
if (!KEY) { console.error('⚠️  未找到 LLMX_KEY（环境变量或 .llmx_key 文件）'); process.exit(1); }
console.log('🔑 LLM 代理已启动，模型:', DEFAULT_MODEL);

// ---- 请求 llmx ----
function askLLM({ prompt, system, model, maxTokens }) {
  const body = {
    model: model || DEFAULT_MODEL,
    messages: [],
    max_tokens: maxTokens || 2500,
    temperature: 0.7,
  };
  if (system) body.messages.push({ role: 'system', content: system });
  body.messages.push({ role: 'user', content: prompt });
  return new Promise((resolve, reject) => {
    const req = https.request(BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + KEY,
      },
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) return reject(new Error('llmx: ' + JSON.stringify(j.error)));
          const msg = j.choices && j.choices[0] && j.choices[0].message;
          if (!msg) return reject(new Error('llmx: no choices'));
          // reasoning 模型 content 可能为空 → 回退 reasoning_content 或返回错误
          resolve({
            content: msg.content || msg.reasoning_content || '',
            model: j.model,
            usage: j.usage || {},
          });
        } catch (e) { reject(new Error('llmx parse: ' + e.message + ' | raw: ' + data.slice(0, 200))); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('llmx timeout')));
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// ---- HTTP 服务 ----
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://localhost');

  // GET /api/models
  if (url.pathname === '/api/models' && req.method === 'GET') {
    return res.end(JSON.stringify({ models: ['DeepSeek-V4-flash','DeepSeek-V4-pro','claude-haiku-4-5','claude-sonnet-4-5','claude-opus-4-8','claude-opus-5','g5.2'] }));
  }

  // POST /api/ask
  if (url.pathname === '/api/ask' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const p = JSON.parse(body);
        if (!p.prompt) { res.writeHead(400); return res.end(JSON.stringify({ error: 'missing prompt' })); }
        const r = await askLLM(p);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(r));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /api/health
  if (url.pathname === '/api/health') { return res.end(JSON.stringify({ ok: true })); }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log('🚀 LLM 代理: http://localhost:' + PORT + '  (POST /api/ask)'));
