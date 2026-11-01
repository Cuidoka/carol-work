import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHandler } from './lib/handler.mjs';
import { getDatabase } from './lib/database.mjs';

// Também usado nos testes com PostgreSQL/PGlite descartável injetado.
export function createPreview(client) {
  const handle = createHandler(client);
  const assets = new Map([
    ['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
    ['/app.js', ['app.js', 'text/javascript']], ['/styles.css', ['styles.css', 'text/css']],
    ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
  ]);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const init = { method: req.method, headers: req.headers };
        if (!['GET', 'HEAD'].includes(req.method)) Object.assign(init, { body: req, duplex: 'half' });
        const response = await handle(new Request(url, init));
        res.writeHead(response.status, Object.fromEntries(response.headers));
        return Readable.fromWeb(response.body).pipe(res);
      }
      if (!assets.has(url.pathname) || !['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(404); return res.end('Página não encontrada.');
      }
      const [file, type] = assets.get(url.pathname);
      const bytes = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(503); res.end('Serviço indisponível.'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreview(getDatabase());
  server.listen(Number(process.env.PORT ?? 3004), '127.0.0.1', () => console.log(`SETLIST Vercel: http://localhost:${server.address().port}`));
}
