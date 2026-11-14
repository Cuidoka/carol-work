'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createCatalogSearch } = require('../lib/catalog.cjs');
const { createApp } = require('../server');
const apple = { kind: 'song', trackId: 12, trackName: 'Teste', artistName: 'Banda', collectionName: 'Estúdio', trackTimeMillis: 243444, trackViewUrl: 'https://music.apple.com/br/song/teste/12' };
const params = (catalogo = 'itunes') => new URLSearchParams({ titulo: 'Teste & "Som"', artista: 'Banda', catalogo });

test('Metadados convertem milissegundos, descartam durações inválidas e evitam fonte externa', async () => {
  let calls = 0;
  const search = createCatalogSearch(async (url, init) => {
    calls++; assert.equal(url.origin, 'https://itunes.apple.com');
    assert.equal(url.searchParams.get('term'), 'Teste & "Som" Banda');
    assert.equal(init.redirect, 'error');
    return Response.json({ results: [apple, apple, { ...apple, trackId: 13, trackTimeMillis: 0 },
      { ...apple, trackId: 14, trackTimeMillis: 36001000 }, { ...apple, trackId: 15, trackViewUrl: 'https://evil.example/x' }] });
  });
  const rows = await search(params());
  assert.equal(rows.length, 2); assert.equal(rows[0].duracao_segundos, 243);
  assert.equal(rows[1].fonte, 'https://music.apple.com/br/song/15');
  assert.deepEqual(await search(params()), rows); assert.equal(calls, 1);
  await assert.rejects(search(new URLSearchParams({ titulo: 'Outra', artista: 'Banda' })), { status: 429 });
});

test('MusicBrainz codifica pesquisa e reúne créditos da gravação com duração', async () => {
  const rows = await createCatalogSearch(async url => {
    assert.equal(url.origin, 'https://musicbrainz.org');
    assert.equal(url.searchParams.get('query'), 'recording:"Teste & \\"Som\\"" AND artist:"Banda"');
    return Response.json({ recordings: [{ id: '12345678-abcd-abcd-abcd-123456789abc', title: 'Teste', length: 200001,
      'artist-credit': [{ name: 'Banda', joinphrase: ' e ' }, { artist: { name: 'Cantora' } }], releases: [{ title: 'Ao vivo' }] }] });
  })(params('musicbrainz'));
  assert.equal(rows[0].artista, 'Banda e Cantora'); assert.equal(rows[0].duracao_segundos, 200);
  assert.equal(rows[0].album, 'Ao vivo'); assert.match(rows[0].fonte, /^https:\/\/musicbrainz\.org\/recording\//);
});

test('Catálogos validam entrada, vazio, offline, JSON inválido e Retry-After', async () => {
  await assert.rejects(createCatalogSearch()(new URLSearchParams()), { status: 400 });
  await assert.rejects(createCatalogSearch()(params('inexistente')), { status: 400 });
  assert.deepEqual(await createCatalogSearch(async () => Response.json({ results: [] }))(params()), []);
  for (const response of [new Response('bad'), Response.json({ results: {} }), new Response('', { status: 403 })]) {
    await assert.rejects(createCatalogSearch(async () => response)(params()), { status: 502 });
  }
  await assert.rejects(createCatalogSearch(async () => { throw new Error('offline'); })(params()), { status: 502 });
  let count = 0;
  const limited = createCatalogSearch(async () => { count++; return new Response('', { status: 429, headers: { 'Retry-After': '60' } }); });
  await assert.rejects(limited(params()), { status: 429 });
  await assert.rejects(limited(params()), { status: 429 }); assert.equal(count, 1);
});

test('SQLite e Neon expõem catálogo sem abrir conexão externa de banco nem gravar músicas', async t => {
  const catalogFetch = async () => Response.json({ results: [apple] });
  const app = createApp({ dbPath: ':memory:', seed: false, catalogFetch });
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  t.after(async () => { const done = once(app.server, 'close'); app.server.close(); app.server.closeAllConnections(); await done; });
  const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api/catalogo?${params()}`);
  assert.equal(response.status, 200); assert.equal((await response.json())[0].duracao_segundos, 243);
  assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM musicas').get().n, 0);
  const { createHandler } = await import('../vercel/lib/handler.mjs');
  const handler = createHandler({ connect() { throw new Error('Busca independe do banco'); } }, { catalogFetch });
  const online = await handler(new Request(`http://localhost/api/catalogo?${params()}`));
  assert.equal(online.status, 200); assert.equal((await online.json())[0].duracao_segundos, 243);
});
