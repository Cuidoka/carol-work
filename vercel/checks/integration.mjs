import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { PGlite } from '@electric-sql/pglite';
import { createHandler } from '../lib/handler.mjs';
import { createPreview } from '../dev.mjs';
import endpoint from '../api/index.mjs';
import { runSmoke } from '../scripts/smoke.mjs';

test('Versão Neon: contrato HTTP e SQL em PostgreSQL/PGlite descartável', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'setlist-vercel-'));
  let engine = await PGlite.create(directory);
  await engine.exec(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
  // Adaptador de testes para a interface query/connect do driver Neon.
  // O SQL é executado pelo PostgreSQL em WASM, não simulado com respostas fixas.
  const client = {
    query: async (sql, args = []) => {
      const result = await engine.query(sql, args);
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    },
    async connect() { return { query: this.query, release: async () => {} }; }
  };
  const handler = createHandler(client);
  t.after(async () => { await engine.close(); await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); });
  const call = async (route, method = 'GET', data, expected = 200) => {
    const request = new Request('http://localhost/api' + route, { method,
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data) });
    const response = await handler(request);
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    if (expected >= 400) assert.equal(typeof result.erro, 'string');
    return result;
  };
  let a, b, show, other;
  await t.test('Migração PostgreSQL preserva registros anteriores e pode ser repetida', async () => {
    const old = await PGlite.create();
    try {
      await old.exec(`CREATE TABLE musicas(id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo TEXT NOT NULL, artista TEXT NOT NULL, duracao_segundos INTEGER NOT NULL, criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
        INSERT INTO musicas(titulo,artista,duracao_segundos) VALUES('Anterior','Banda',200);`);
      const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
      await old.exec(schema); await old.exec(schema);
      const row = (await old.query('SELECT * FROM musicas')).rows[0];
      assert.equal(row.id, 1); assert.equal(row.titulo, 'Anterior'); assert.equal(row.letra, '');
    } finally { await old.close(); }
  });
  await t.test('PostgreSQL: PKs, FKs com cascata, CHECK e UNIQUE no catálogo real', async () => {
    const constraints = await client.query(`SELECT contype, confdeltype FROM pg_constraint
      WHERE conrelid IN ('musicas'::regclass, 'setlists'::regclass, 'setlist_musicas'::regclass)`);
    assert.equal(constraints.rows.filter(item => item.contype === 'p').length, 3);
    assert.equal(constraints.rows.filter(item => item.contype === 'f' && item.confdeltype === 'c').length, 2);
    assert.ok(constraints.rows.some(item => item.contype === 'u'));
    await assert.rejects(client.query("INSERT INTO musicas (titulo, artista, duracao_segundos) VALUES ('A','B',0)"), error => error.code === '23514');
    await assert.rejects(client.query("INSERT INTO setlists (nome) VALUES (' ')"), error => error.code === '23514');
  });
  await t.test('CREATE/READ/UPDATE de músicas e repertórios', async () => {
    assert.deepEqual(await call('/musicas'), []);
    a = await call('/musicas', 'POST', { titulo: 'Teste 01', artista: 'Banda A', duracao_segundos: 200 }, 201);
    b = await call('/musicas', 'POST', { titulo: "Teste ' <script>", artista: 'Banda B', duracao_segundos: 195, cifra: 'G    D', notas: 'Teste' }, 201);
    assert.equal(b.cifra, 'G    D');
    b = await call(`/musicas/${b.id}`, 'PUT', { ...b, cifra: '', notas: '', cifra_fonte: 'https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/' });
    assert.equal(b.cifra, ''); assert.equal(b.notas, '');
    assert.equal(b.cifra_fonte, 'https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/');
    a = await call(`/musicas/${a.id}`, 'PUT', { titulo: 'Teste editado', artista: 'Banda editada', duracao_segundos: 250 });
    assert.equal(a.duracao_segundos, 250);
    assert.equal((await call('/musicas')).length, 2);
    const material = { letra: 'Texto próprio\nLinha 2', cifra: 'C     G\nTexto próprio', tom: 'Am', notas: 'Repetir final', letra_fonte: 'https://lrclib.net/api/get/1', cifra_fonte: 'https://www.cifraclub.com.br/banda/faixa/', duracao_fonte: 'https://music.apple.com/br/song/12' };
    a = await call(`/musicas/${a.id}`, 'PUT', { ...a, ...material });
    assert.equal(a.cifra, material.cifra); assert.equal(a.letra, material.letra);
    for (const invalid of [{ letra: null }, { cifra: 'x'.repeat(20001) }, { tom: 42 }, { letra_fonte: 'https://evil.test' }, { cifra_fonte: 'javascript:alert(1)' }, { duracao_fonte: 'https://evil.test/a' }]) {
      await call(`/musicas/${a.id}`, 'PUT', { ...a, ...invalid }, 400);
    }
    show = await call('/setlists', 'POST', { nome: 'Show' }, 201);
    assert.equal(show.duracao_total_segundos, 0);
    show = await call(`/setlists/${show.id}`, 'PUT', { nome: 'Show editado', evento: 'Campus' });
    assert.equal(show.evento, 'Campus');
    other = await call('/setlists', 'POST', { nome: 'Outro show' }, 201);
  });
  await t.test('N:N, duplicidade, JOIN, COUNT/SUM e ordem atômica', async () => {
    for (const item of [a, b]) await call(`/setlists/${show.id}/musicas`, 'POST', { musica_id: item.id }, 201);
    await call(`/setlists/${other.id}/musicas`, 'POST', { musica_id: a.id }, 201);
    await call(`/setlists/${show.id}/musicas`, 'POST', { musica_id: a.id }, 409);
    for (const musica_ids of [[a.id], [a.id, a.id], [a.id, 999], ['1', b.id]]) {
      await call(`/setlists/${show.id}/ordem`, 'PUT', { musica_ids }, 400);
    }
    const result = await call(`/setlists/${show.id}/ordem`, 'PUT', { musica_ids: [b.id, a.id] });
    assert.deepEqual(result.musicas.map(item => item.id), [b.id, a.id]);
    assert.equal(result.duracao_total_segundos, 445);
    assert.equal(result.musicas.find(song => song.id === a.id).letra, 'Texto próprio\nLinha 2');
    assert.equal(result.musicas.find(song => song.id === b.id).cifra, '');
    assert.equal(result.musicas.find(song => song.id === b.id).cifra_fonte, b.cifra_fonte);
    const summary = (await call('/setlists')).find(item => item.id === show.id);
    assert.equal(summary.duracao_total_segundos, 445);
    assert.equal(typeof summary.duracao_total_segundos, 'number');
    assert.equal(typeof summary.quantidade_musicas, 'number');
    const statements = (await readFile(new URL('../database/consultas.sql', import.meta.url), 'utf8')).split(';').filter(sql => sql.trim());
    const [joined, totals, count] = await Promise.all(statements.map(sql => client.query(sql)));
    assert.equal(joined.rows.length, 3);
    assert.equal(totals.rows.find(item => item.id === show.id).duracao_total_segundos, 445);
    assert.equal(count.rows[0].total_musicas, 2);
    await call(`/musicas/${a.id}`, 'PUT', { titulo: a.titulo, artista: a.artista, duracao_segundos: 300 });
    assert.equal((await call(`/setlists/${show.id}`)).duracao_total_segundos, 495);
    await call(`/musicas/${a.id}`, 'PUT', { titulo: a.titulo, artista: a.artista, duracao_segundos: 250 });
  });
  await t.test('Falha SQL durante reordenação faz rollback e libera a conexão', async () => {
    let updates = 0, released = 0;
    const broken = createHandler({ async connect() {
      return {
        query: async (sql, args) => {
          if (sql.startsWith('UPDATE setlist_musicas') && ++updates === 2) return client.query('SELECT coluna_inexistente');
          return client.query(sql, args);
        },
        release: async () => { released++; }
      };
    } });
    const response = await broken(new Request(`http://localhost/api/setlists/${show.id}/ordem`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ musica_ids: [a.id, b.id] })
    }));
    assert.equal(response.status, 503);
    assert.equal(released, 1);
    const saved = await call(`/setlists/${show.id}`);
    assert.deepEqual(saved.musicas.map(item => item.id), [b.id, a.id]);
    assert.deepEqual(saved.musicas.map(item => item.posicao), [1, 2]);
  });
  await t.test('Persistência ao recriar cliente/handler e manter ordem', async () => {
    await engine.close();
    engine = await PGlite.create(directory);
    const result = await call(`/setlists/${show.id}`);
    assert.equal(result.nome, 'Show editado');
    assert.deepEqual(result.musicas.map(item => item.id), [b.id, a.id]);
    assert.equal(result.duracao_total_segundos, 445);
    assert.equal(result.musicas.find(song => song.id === a.id).cifra, 'C     G\nTexto próprio');
    assert.equal(result.musicas.find(song => song.id === a.id).cifra_fonte, 'https://www.cifraclub.com.br/banda/faixa/');
    assert.equal(result.musicas.find(song => song.id === a.id).duracao_fonte, 'https://music.apple.com/br/song/12');
  });
  await t.test('DELETE: vínculo preserva biblioteca; cascatas preservam outras entidades', async () => {
    await call(`/setlists/${show.id}/musicas/${a.id}`, 'DELETE');
    assert.equal((await call('/musicas')).length, 2);
    assert.equal((await call(`/setlists/${other.id}`)).quantidade_musicas, 1);
    await call(`/setlists/${show.id}/musicas`, 'POST', { musica_id: a.id }, 201);
    await call(`/musicas/${a.id}`, 'DELETE');
    assert.equal((await call(`/setlists/${other.id}`)).duracao_total_segundos, 0);
    await call(`/setlists/${show.id}`, 'DELETE');
    assert.equal((await call('/musicas'))[0].id, b.id);
    assert.deepEqual((await client.query(`SELECT sm.id FROM setlist_musicas sm
      LEFT JOIN musicas m ON m.id=sm.musica_id LEFT JOIN setlists s ON s.id=sm.setlist_id
      WHERE m.id IS NULL OR s.id IS NULL`)).rows, []);
    assert.equal(Number((await client.query('SELECT COUNT(*) AS n FROM setlist_musicas')).rows[0].n), 0);
  });
  await t.test('Validações, erros, FK real e respostas sem cache', async () => {
    for (const duracao_segundos of [0, 36001, -1, 1.5, '200']) {
      await call('/musicas', 'POST', { titulo: 'A', artista: 'B', duracao_segundos }, 400);
    }
    await call('/setlists', 'POST', { nome: ' ' }, 400);
    await call('/setlists', 'POST', { nome: 'x'.repeat(121) }, 400);
    await call('/setlists/abc', 'GET', undefined, 400);
    await call('/setlists/2147483648', 'GET', undefined, 400);
    await call('/setlists/999', 'GET', undefined, 404);
    await call('/musicas/999', 'DELETE', undefined, 404);
    await call('/inexistente', 'GET', undefined, 404);
    await call(`/setlists/${other.id}/musicas`, 'POST', { musica_id: 999 }, 404);
    for (const [body, type, status] of [['{', 'application/json', 400], ['x'.repeat(300000), 'application/json', 413], ['{}', 'text/plain', 415]]) {
      const response = await handler(new Request('http://localhost/api/musicas', { method: 'POST', headers: { 'Content-Type': type }, body }));
      assert.equal(response.status, status);
    }
    await assert.rejects(client.query('INSERT INTO setlist_musicas (setlist_id, musica_id, posicao) VALUES (999,999,1)'), error => error.code === '23503');
    const result = await handler(new Request('http://localhost/api/musicas'));
    assert.equal(result.headers.get('cache-control'), 'no-store');
  });
  await t.test('Preview HTTP real serve arquivos e API; não expõe arquivos privados', async () => {
    const server = createPreview(client);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      const html = await (await fetch(base)).text();
      assert.match(html, /id="root"/);
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
      assert.ok(assets.some(asset => asset.endsWith('.js')));
      assert.ok(assets.some(asset => asset.endsWith('.css')));
      for (const asset of ['/', '/favicon.svg', ...assets]) assert.equal((await fetch(base + asset)).status, 200);
      for (const asset of ['/lib/database.mjs', '/.env.local', '/database/schema.sql']) assert.equal((await fetch(base + asset)).status, 404);
      const result = await fetch(base + '/api/musicas');
      assert.equal(result.status, 200);
      assert.equal((await result.json()).length, 1);
      assert.match(await runSmoke(base), /PASSOU/);
      assert.equal((await (await fetch(base + '/api/musicas')).json()).length, 1);
    } finally { const closed = once(server, 'close'); server.close(); server.closeAllConnections(); await closed; }
  });
});

test('Endpoint publicado falha de forma explícita sem DATABASE_URL', async () => {
  const savedUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const result = await endpoint.fetch(new Request('http://localhost/api/musicas'));
    assert.equal(result.status, 503);
    assert.match((await result.json()).erro, /configuração/);
  } finally {
    if (savedUrl !== undefined) process.env.DATABASE_URL = savedUrl;
  }
});
