import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { once } from 'node:events';

const { createApp } = createRequire(import.meta.url)('../server.js');
let backend, vite;
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  await vite?.close();
  if (backend?.server.listening) await new Promise(resolve => backend.server.close(resolve));
  else backend?.db.close();
  process.exitCode = code;
}
try {
  backend = createApp();
  backend.server.listen(Number(process.env.PORT || 3000), '127.0.0.1');
  await once(backend.server, 'listening');
  vite = await createServer();
  await vite.listen();
  vite.printUrls();
  console.log(`API SQLite: http://localhost:${backend.server.address().port}`);
}
catch (error) { console.error(error.message); await close(1); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { void close(); });
