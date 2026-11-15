'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../server');
const { createBackup, MAX_BYTES } = require('../lib/backup.cjs');
const { fixture, contract, contents } = require('./support/backup-contract.cjs');

test('Backup SQLite preserva dados existentes, N:N, material, ordem e permite restaurar em outro banco', async t => {
  const apps = [];
  t.after(async () => { for (const app of apps) { const closed = once(app.server, 'close'); app.server.close(); app.server.closeAllConnections(); await closed; } });
  async function start() {
    const app = createApp({ dbPath: ':memory:', seed: false }); apps.push(app);
    app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
    return { app, call: async (route, method = 'GET', body, status = 200) => {
      const response = await fetch(`http://127.0.0.1:${app.server.address().port}/api${route}`, { method,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
    } };
  }
  const { app, call } = await start();
  const exported = await contract(call);
  const other = await start();
  await other.call('/backup', 'POST', exported, 201);
  const copy = await other.call('/backup');
  assert.equal(copy.musicas.length, 3); assert.equal(copy.setlists.length, 4);
  const show = (await other.call('/setlists')).find(row => row.nome === 'Show autoral');
  assert.equal(show.duracao_total_segundos, 445);
  const before = contents(await call('/backup'));
  app.db.exec("CREATE TRIGGER abort_restore BEFORE INSERT ON musicas WHEN NEW.titulo='Rejeitar' BEGIN SELECT RAISE(ABORT, 'Falha simulada'); END");
  const broken = fixture(); broken.musicas[1].titulo = 'Rejeitar';
  await call('/backup', 'POST', broken, 500);
  assert.deepEqual(contents(await call('/backup')), before, 'Falha no meio da escrita exige rollback');
  assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(), []);
  const oversized = { ...fixture(), extra: 'x'.repeat(MAX_BYTES) };
  await call('/backup', 'POST', oversized, 413);
  assert.deepEqual(contents(await call('/backup')), before);
});

test('Backup não exporta campos arbitrários nem permite arquivo maior que o limite', () => {
  const song = { id: 1, titulo: 'Teste', artista: 'Banda', duracao_segundos: 200, secreto: 'não exportar' };
  assert.equal(createBackup([song], [], []).musicas[0].secreto, undefined);
  assert.throws(() => createBackup([{ ...song, letra: 'x'.repeat(MAX_BYTES) }], [], []), { status: 413 });
});
