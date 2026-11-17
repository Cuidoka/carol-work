'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createChartSearch } = require('../lib/cifraclub.cjs');
const { createApp } = require('../server.js');

// Metadados do contrato observado em 2026-11-16. Nenhuma letra/cifra de terceiros.
const song = { type: 'song', id: 'cm_13440', name: 'Dois Rios', slug: 'dois-rios', artist: { name: 'Skank', slug: 'skank' } };
const fonte = 'https://www.cifraclub.com.br/skank/dois-rios/';
const expected = [{ id: fonte, titulo: 'Dois Rios', artista: 'Skank', fonte }];
const params = (titulo = 'Dois Rios', artista = 'Skank') => new URLSearchParams({ titulo, artista });
const response = (results = [song]) => Response.json({ results });

test('T-CIFRA-001: consulta somente o endpoint fixo com parâmetros codificados', async () => {
  let calls = 0;
  const search = createChartSearch(async (url, options) => {
    calls++;
    assert.equal(url.origin, 'https://solr.sscdn.co');
    assert.equal(url.pathname, '/cifraclub-explore/v1/search/suggest');
    assert.equal(url.searchParams.get('q'), 'João & Maria Chico + Buarque');
    assert.equal(url.searchParams.get('lang'), 'pt');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    return response();
  });
  assert.deepEqual(await search(params(' João & Maria ', ' Chico + Buarque ')), expected);
  assert.equal(calls, 1);
});

test('T-CIFRA-002: rejeita entradas ausentes, longas e NUL sem chamar a fonte', async () => {
  let calls = 0;
  const search = createChartSearch(async () => { calls++; return response(); });
  for (const query of [new URLSearchParams(), params(''), params('Dois Rios', ' '), params('x'.repeat(121)), params('a\0b')]) {
    await assert.rejects(search(query), { status: 400 });
  }
  assert.equal(calls, 0);
});

test('T-CIFRA-003: filtra artistas, álbuns, slugs inseguros e duplicatas', async () => {
  const rows = [null, { ...song, type: 'artist' }, { ...song, type: 'album' },
    { ...song, slug: '../admin' }, { ...song, slug: 'a?b' }, { ...song, artist: { name: 'X', slug: '//evil.test' } },
    { ...song, name: '' }, { ...song, artist: null }, song, song];
  assert.deepEqual(await createChartSearch(async () => response(rows))(params()), expected);
});

test('T-CIFRA-004: mantém busca vazia válida e limita a 12 músicas', async () => {
  assert.deepEqual(await createChartSearch(async () => response([]))(params()), []);
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...song, slug: `musica-${i}` }));
  const records = await createChartSearch(async () => response(rows))(params());
  assert.equal(records.length, 12);
  assert.equal(records[11].fonte, 'https://www.cifraclub.com.br/skank/musica-11/');
});

test('T-CIFRA-005: reutiliza cache sem uma segunda chamada', async () => {
  let calls = 0;
  const search = createChartSearch(async () => { calls++; return response(); });
  await search(params());
  assert.deepEqual(await search(params(' dois rios ', ' SKANK ')), expected);
  assert.equal(calls, 1);
});

test('T-CIFRA-006: bloqueia consultas concorrentes', async () => {
  let finish;
  const search = createChartSearch(() => new Promise(resolve => { finish = resolve; }));
  const pending = search(params());
  await assert.rejects(search(params('Outra música')), { status: 429 });
  finish(response());
  assert.deepEqual(await pending, expected);
});

for (const status of [403, 503]) {
  test(`T-CIFRA-007: traduz HTTP ${status} da fonte em erro 502`, async () => {
    const search = createChartSearch(async () => new Response('indisponível', { status }));
    await assert.rejects(search(params()), { status: 502 });
  });
}

test('T-CIFRA-008: respeita limite de consultas da fonte', async () => {
  let calls = 0;
  const search = createChartSearch(async () => { calls++; return new Response('', { status: 429, headers: { 'Retry-After': '60' } }); });
  await assert.rejects(search(params()), { status: 429 });
  await assert.rejects(search(params('Outra música')), { status: 429 });
  assert.equal(calls, 1);
});

for (const [label, fetcher] of [
  ['JSON malformado', async () => new Response('{')],
  ['contrato inesperado', async () => Response.json({ songs: [] })],
  ['resposta excessiva', async () => new Response('x'.repeat(2000001))],
  ['falha de rede', async () => { throw new TypeError('network'); }],
  ['timeout', async () => { throw new DOMException('timeout', 'TimeoutError'); }]
]) {
  test(`T-CIFRA-009: trata ${label} sem expor detalhes internos`, async () => {
    const search = createChartSearch(fetcher);
    await assert.rejects(search(params()), error => error.status === 502 && !error.message.includes('network'));
  });
}

test('T-CIFRA-010: API SQLite busca, salva o link e preserva texto/dados da música', async t => {
  const app = createApp({ dbPath: ':memory:', seed: false, chartFetch: async () => response() });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  t.after(() => new Promise(resolve => app.server.close(resolve)));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const found = await fetch(`${base}/api/cifras?${params()}`);
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), expected);
  const invalid = await fetch(`${base}/api/cifras?titulo=x`);
  assert.equal(invalid.status, 400);
  const original = { titulo: 'Teste autoral', artista: 'Teste', duracao_segundos: 120, cifra: 'C      G\nMelodia de teste autoral' };
  const created = await fetch(`${base}/api/musicas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(original) });
  assert.equal(created.status, 201);
  const saved = await created.json();
  const changed = await fetch(`${base}/api/musicas/${saved.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: original.titulo, artista: original.artista, duracao_segundos: original.duracao_segundos, cifra_fonte: fonte }) });
  assert.equal(changed.status, 200);
  const result = await changed.json();
  assert.equal(result.cifra, original.cifra);
  assert.equal(result.cifra_fonte, fonte);
  assert.equal(result.titulo, original.titulo);
  assert.equal(result.artista, original.artista);
});

test('T-CIFRA-011: API Vercel consulta sem abrir conexão com o banco', async () => {
  const { createHandler } = await import('../vercel/lib/handler.mjs');
  const client = { connect: async () => { assert.fail('Busca de cifras não deve acessar o banco'); } };
  const handle = createHandler(client, { chartFetch: async () => response() });
  const found = await handle(new Request(`https://setlist.test/api/cifras?${params()}`));
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), expected);
  const invalid = await handle(new Request('https://setlist.test/api/cifras'));
  assert.equal(invalid.status, 400);
  const failure = createHandler(client, { chartFetch: async () => new Response('', { status: 403 }) });
  assert.equal((await failure(new Request(`https://setlist.test/api/cifras?${params()}`))).status, 502);
});
