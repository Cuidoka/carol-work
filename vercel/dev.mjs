import http from 'node:http';
import staticFiles from '../lib/static.cjs';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHandler } from './lib/handler.mjs';
import { getDatabase } from './lib/database.mjs';

// Também usado nos testes com PostgreSQL/PGlite descartável injetado.
export function createPreview(client) {
  const handle = createHandler(client);
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
      if (!staticFiles.serveStatic(req, res)) { res.writeHead(404); res.end('Página não encontrada.'); }
    } catch { res.writeHead(503); res.end('Serviço indisponível.'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreview(getDatabase());
  server.listen(Number(process.env.PORT ?? 3004), '127.0.0.1', () => console.log(`SETLIST Vercel: http://localhost:${server.address().port}`));
}
