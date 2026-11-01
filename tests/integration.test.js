'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createApp } = require('../server');

async function start(dbPath, seed = false) {
  const app = createApp({ dbPath, seed });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  app.url = `http://127.0.0.1:${app.server.address().port}`;
  return app;
}
async function stop(app) {
  const closed = once(app.server, 'close');
  app.server.close();
  app.server.closeAllConnections();
  await closed;
}

test('MVP integrado: HTTP → SQLite, consultas e reinicialização', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'setlist-test-'));
  const dbPath = path.join(temp, 'teste.sqlite');
  let app = await start(dbPath);
  t.after(async () => { if (app.server.listening) await stop(app); fs.rmSync(temp, { recursive: true, force: true }); });
  async function request(route, method = 'GET', body, expected = 200) {
    const response = await fetch(`${app.url}${route}`, { method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    if (expected >= 400) assert.equal(typeof result.erro, 'string');
    return result;
  }
  let first, second, setlist, other;

  await t.test('HTML/CSS/JS servidos; arquivos privados inacessíveis', async () => {
    for (const asset of ['/', '/app.js', '/styles.css', '/favicon.svg']) {
      const response = await fetch(app.url + asset);
      assert.equal(response.status, 200);
      assert.ok((await response.text()).length > 0);
    }
    await request('/server.js', 'GET', undefined, 404);
    await request('/dados/setlist.sqlite', 'GET', undefined, 404);
    await request('/api/inexistente', 'GET', undefined, 404);
    assert.equal((await fetch(app.url, { method: 'HEAD' })).status, 200);
  });
  await t.test('PK/FK, UNIQUE e CHECK ativos no banco real', async () => {
    assert.equal(app.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    for (const table of ['musicas', 'setlists', 'setlist_musicas']) {
      assert.ok(app.db.prepare(`PRAGMA table_info(${table})`).all().some(column => column.name === 'id' && column.pk === 1));
    }
    assert.equal(app.db.prepare('PRAGMA foreign_key_list(setlist_musicas)').all().length, 2);
    assert.throws(() => app.db.prepare('INSERT INTO setlist_musicas (setlist_id, musica_id, posicao) VALUES (99, 99, 1)').run(), /FOREIGN KEY/);
    assert.throws(() => app.db.prepare("INSERT INTO musicas (titulo, artista, duracao_segundos) VALUES ('A', 'B', 0)").run(), /CHECK/);
    assert.throws(() => app.db.prepare("INSERT INTO musicas (titulo, artista, duracao_segundos) VALUES ('A', 'B', 1.5)").run(), /CHECK/);
  });
  await t.test('CRUD de músicas e setlists; biblioteca inicialmente vazia', async () => {
    assert.deepEqual(await request('/api/musicas'), []);
    assert.deepEqual(await request('/api/setlists'), []);
    first = await request('/api/musicas', 'POST', { titulo: ' Teste 01 ', artista: 'Banda A', duracao_segundos: 200 }, 201);
    assert.equal(first.titulo, 'Teste 01');
    second = await request('/api/musicas', 'POST', { titulo: "Faixa ' SQL <b>", artista: 'Banda B', duracao_segundos: 195 }, 201);
    first = await request(`/api/musicas/${first.id}`, 'PUT', { titulo: 'Teste 01 editada', artista: 'Banda A', duracao_segundos: 250 });
    assert.equal(first.duracao_segundos, 250);
    assert.equal((await request('/api/musicas')).length, 2);
    setlist = await request('/api/setlists', 'POST', { nome: 'Apresentação Teste' }, 201);
    assert.equal(setlist.evento, '');
    assert.equal(setlist.duracao_total_segundos, 0);
    other = await request('/api/setlists', 'POST', { nome: 'Outro show', evento: 'Campus' }, 201);
    setlist = await request(`/api/setlists/${setlist.id}`, 'PUT', { nome: 'Show atualizado', evento: 'Auditório' });
    assert.equal(setlist.evento, 'Auditório');
  });
  await t.test('Relacionamento N:N, duplicidade e reordenação válida/ inválida', async () => {
    for (const song of [first, second]) await request(`/api/setlists/${setlist.id}/musicas`, 'POST', { musica_id: song.id }, 201);
    await request(`/api/setlists/${other.id}/musicas`, 'POST', { musica_id: first.id }, 201);
    await request(`/api/setlists/${setlist.id}/musicas`, 'POST', { musica_id: first.id }, 409);
    assert.throws(() => app.db.prepare('INSERT INTO setlist_musicas (setlist_id, musica_id, posicao) VALUES (?, ?, 9)').run(setlist.id, first.id), /UNIQUE/);
    for (const ids of [[first.id], [first.id, first.id], [first.id, 99999], ['1', second.id], null]) {
      await request(`/api/setlists/${setlist.id}/ordem`, 'PUT', { musica_ids: ids }, 400);
    }
    const result = await request(`/api/setlists/${setlist.id}/ordem`, 'PUT', { musica_ids: [second.id, first.id] });
    assert.deepEqual(result.musicas.map(song => song.id), [second.id, first.id]);
    assert.deepEqual(result.musicas.map(song => song.posicao), [1, 2]);
    assert.equal(result.duracao_total_segundos, 445);
  });
  await t.test('JOIN e COUNT/SUM executados do arquivo SQL; alteração reflete na soma', async () => {
    const statements = fs.readFileSync(path.join(__dirname, '../database/consultas.sql'), 'utf8').split(';').filter(sql => sql.trim());
    const [joined, aggregate, count] = statements.map(sql => app.db.prepare(sql).all());
    assert.equal(joined.length, 3);
    assert.equal(joined[0].setlist, 'Outro show');
    assert.ok(joined.some(row => row.musica === second.titulo && row.posicao === 1));
    const totals = aggregate.find(row => row.id === setlist.id);
    assert.equal(totals.quantidade_musicas, 2);
    assert.equal(totals.duracao_total_segundos, 445);
    assert.equal(count[0].total_musicas, 2);
    const summary = (await request('/api/setlists')).find(row => row.id === setlist.id);
    assert.equal(summary.duracao_total_segundos, 445);
    await request(`/api/musicas/${first.id}`, 'PUT', { titulo: first.titulo, artista: first.artista, duracao_segundos: 300 });
    assert.equal((await request(`/api/setlists/${setlist.id}`)).duracao_total_segundos, 495);
    await request(`/api/musicas/${first.id}`, 'PUT', { titulo: first.titulo, artista: first.artista, duracao_segundos: 250 });
  });
  await t.test('Dados e ordem persistem após fechar servidor/banco e abrir novamente', async () => {
    await stop(app);
    app = await start(dbPath);
    const result = await request(`/api/setlists/${setlist.id}`);
    assert.deepEqual(result.musicas.map(song => song.id), [second.id, first.id]);
    assert.equal(result.duracao_total_segundos, 445);
    assert.equal(result.nome, 'Show atualizado');
    assert.equal((await request('/api/musicas')).length, 2);
  });
  await t.test('Remover vínculo preserva música; cascatas preservam entidades independentes', async () => {
    await request(`/api/setlists/${setlist.id}/musicas/${first.id}`, 'DELETE');
    assert.equal((await request('/api/musicas')).length, 2);
    assert.equal((await request(`/api/setlists/${other.id}`)).musicas.length, 1);
    await request(`/api/setlists/${setlist.id}/musicas`, 'POST', { musica_id: first.id }, 201);
    await request(`/api/musicas/${first.id}`, 'DELETE');
    assert.equal((await request(`/api/setlists/${other.id}`)).musicas.length, 0);
    assert.equal((await request(`/api/setlists/${setlist.id}`)).musicas.length, 1);
    const empty = (await request('/api/setlists')).find(row => row.id === other.id);
    assert.equal(empty.quantidade_musicas, 0);
    assert.equal(empty.duracao_total_segundos, 0);
    await request(`/api/setlists/${setlist.id}`, 'DELETE');
    assert.equal((await request('/api/musicas'))[0].id, second.id);
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM setlist_musicas').get().n, 0);
    assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(), []);
  });
  await t.test('Validações HTTP: textos, duração, JSON, tamanho, IDs e inexistentes', async () => {
    for (const value of [0, -1, 36001, 1.5, '200', null]) {
      await request('/api/musicas', 'POST', { titulo: 'A', artista: 'B', duracao_segundos: value }, 400);
    }
    for (const data of [{ titulo: ' ', artista: 'B', duracao_segundos: 2 }, { titulo: 'A', artista: 'x'.repeat(121), duracao_segundos: 2 }, null, []]) {
      await request('/api/musicas', 'POST', data, 400);
    }
    await request('/api/setlists', 'POST', { nome: ' ' }, 400);
    await request('/api/setlists', 'POST', { nome: 'A', evento: null }, 400);
    await request('/api/setlists/abc', 'GET', undefined, 400);
    await request('/api/setlists/9007199254740992', 'GET', undefined, 400);
    await request('/api/setlists/9999', 'GET', undefined, 404);
    await request('/api/musicas/9999', 'DELETE', undefined, 404);
    await request(`/api/setlists/${other.id}/musicas`, 'POST', { musica_id: 9999 }, 404);
    await request(`/api/setlists/${other.id}/musicas`, 'POST', { musica_id: '1' }, 400);
    await request(`/api/setlists/${other.id}/musicas/9999`, 'DELETE', undefined, 404);
    for (const [body, contentType, expected] of [['{', 'application/json', 400], ['{}', 'text/plain', 415], ['x'.repeat(70000), 'application/json', 413]]) {
      const response = await fetch(`${app.url}/api/musicas`, { method: 'POST', headers: { 'Content-Type': contentType }, body });
      assert.equal(response.status, expected);
      assert.ok((await response.json()).erro);
    }
  });
});

test('Exemplos são criados uma única vez e não retornam ao esvaziar a biblioteca', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'setlist-seed-'));
  const dbPath = path.join(temp, 'seed.sqlite');
  let app;
  try {
    app = await start(dbPath, true);
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM musicas').get().n, 5);
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM setlist_musicas').get().n, 3);
    app.db.exec('DELETE FROM musicas; DELETE FROM setlists;');
    await stop(app);
    app = await start(dbPath, true);
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM musicas').get().n, 0);
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM setlists').get().n, 0);
  } finally { if (app?.server.listening) await stop(app); fs.rmSync(temp, { recursive: true, force: true }); }
});
