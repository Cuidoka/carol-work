'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '..', 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

// Entrega somente o build React; fontes, banco e segredos não são publicados.
function serveStatic(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const route = new URL(req.url, 'http://localhost').pathname;
  let relative;
  if (route === '/' || route === '/index.html') relative = 'index.html';
  else if (route === '/favicon.svg') relative = 'favicon.svg';
  else if (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(route)) relative = route.slice(1);
  else return false;
  const file = path.join(dist, relative);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    if (relative === 'index.html') {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Build React não encontrado. Execute npm run build na raiz do projeto.');
      return true;
    }
    return false;
  }
  res.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': relative.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
  return true;
}
module.exports = { serveStatic };
