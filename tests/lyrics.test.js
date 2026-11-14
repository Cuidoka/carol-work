'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLyricsSearch } = require('../lib/lyrics.cjs');
const { createApp } = require('../server');
const { once } = require('node:events');
const params = () => new URLSearchParams({ titulo: 'Faixa & teste', artista: 'Banda' });
const record = { id: 3, trackName: 'Faixa', artistName: 'Banda', albumName: 'Álbum', duration: 200, plainLyrics: 'Texto de teste' };

test('Busca valida entrada, codifica consulta e retorna opções com fonte sem gravar', async () => {
  let count = 0;
  const search = createLyricsSearch(async (url, init) => {
    count++; assert.equal(url.origin, 'https://lrclib.net');
    assert.equal(url.searchParams.get('track_name'), 'Faixa & teste');
    assert.match(init.headers['User-Agent'], /SETLIST/);
    return Response.json([record, { id: 4, instrumental: true }, { ...record, id: 0 }, { ...record, plainLyrics: 'x'.repeat(20001) }]);
  });
  await assert.rejects(search(new URLSearchParams()), { status: 400 });
  const result = await search(params());
  assert.equal(count, 1); assert.equal(result.length, 1);
  assert.equal(result[0].fonte, 'https://lrclib.net/api/get/3');
  assert.equal(result[0].letra, 'Texto de teste');
});
test('Catálogo vazio, indisponível, inválido e limite Retry-After têm respostas claras', async () => {
  assert.deepEqual(await createLyricsSearch(async () => Response.json([]))(params()), []);
  for (const response of [new Response('', { status: 503 }), Response.json({ wrong: true })]) {
    await assert.rejects(createLyricsSearch(async () => response)(params()), { status: 502 });
  }
  await assert.rejects(createLyricsSearch(async () => { throw new Error('offline'); })(params()), { status: 502 });
  let requests = 0;
  const limited = createLyricsSearch(async () => { requests++; return new Response('', { status: 429, headers: { 'Retry-After': '60' } }); });
  await assert.rejects(limited(params()), { status: 429 });
  await assert.rejects(limited(params()), { status: 429 });
  assert.equal(requests, 1);
});
test('Rota HTTP SQLite e handler Neon compartilham a busca sem alterar a biblioteca', async t => {
  const lyricsFetch = async () => Response.json([record]);
  const app = createApp({ dbPath: ':memory:', seed: false, lyricsFetch });
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  t.after(async () => { const done = once(app.server, 'close'); app.server.close(); app.server.closeAllConnections(); await done; });
  const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api/letras?${params()}`);
  assert.equal(response.status, 200); assert.equal((await response.json())[0].id, 3);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM musicas').get().n, 0);
  const { createHandler } = await import('../vercel/lib/handler.mjs');
  const handler = createHandler({ connect() { throw new Error('Busca não precisa abrir banco'); } }, { lyricsFetch });
  const online = await handler(new Request(`http://localhost/api/letras?${params()}`));
  assert.equal(online.status, 200); assert.equal((await online.json())[0].id, 3);
});
