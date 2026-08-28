/**
 * 静态文件服务器（供启动题库.bat 使用）
 * 用法: node web_server.js [端口]   (默认 8090)
 * 根目录: 本文件所在目录，默认入口 index.html
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 8090);
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  let f = u === '/' ? 'index.html' : u.slice(1);
  // 路径穿越防护
  const fp = path.normalize(path.join(ROOT, f));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(fp, (e, d) => {
    if (e) {
      // 找不到时尝试加 .html（支持 /explore 访问 explore.html）
      const alt = fp + '.html';
      fs.readFile(alt, (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('404: ' + f); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(PORT, () => console.log('📚 QIB 静态服务器: http://localhost:' + PORT + '/'));
