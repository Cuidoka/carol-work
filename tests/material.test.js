'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createApp } = require('../server');

test('Migração SQLite preserva banco anterior, material persiste e atualizações antigas não o apagam', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'setlist-material-'));
  const dbPath = path.join(dir, 'legacy.sqlite');
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE musicas(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, artista TEXT NOT NULL, duracao_segundos INTEGER NOT NULL, criado_em TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE setlists(id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, evento TEXT DEFAULT '', criado_em TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE setlist_musicas(id INTEGER PRIMARY KEY AUTOINCREMENT, setlist_id INTEGER REFERENCES setlists(id) ON DELETE CASCADE, musica_id INTEGER REFERENCES musicas(id) ON DELETE CASCADE, posicao INTEGER, UNIQUE(setlist_id,musica_id));
    INSERT INTO musicas VALUES(7,'Anterior','Banda',200,'2026-11-01');
    INSERT INTO setlists VALUES(4,'Show','Sala','2026-11-01');
    INSERT INTO setlist_musicas VALUES(2,4,7,1);`);
  legacy.close();
  let app;
  const start = async () => { app = createApp({ dbPath }); app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening'); };
  const stop = async () => { const done = once(app.server, 'close'); app.server.close(); app.server.closeAllConnections(); await done; };
  t.after(async () => { if (app.server.listening) await stop(); fs.rmSync(dir, { recursive: true, force: true }); });
  await start();
  const call = async (route, method = 'GET', body, status = 200) => {
    const r = await fetch(`http://127.0.0.1:${app.server.address().port}/api${route}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    const data = await r.json(); assert.equal(r.status, status, JSON.stringify(data)); return data;
  };
  let [song] = await call('/musicas');
  assert.equal(song.id, 7); assert.equal(song.letra, ''); assert.equal(song.criado_em, '2026-11-01');
  const material = { letra: 'Texto próprio\nSegunda linha <script>', cifra: 'C     G\nTexto próprio', tom: 'C', notas: 'Entrar na segunda volta', letra_fonte: 'https://lrclib.net/api/get/1', cifra_fonte: 'https://www.cifraclub.com.br/banda/faixa/', duracao_fonte: 'https://music.apple.com/br/song/12' };
  song = await call('/musicas/7', 'PUT', { ...song, ...material });
  for (const [key, value] of Object.entries(material)) assert.equal(song[key], value);
  // Cliente anterior envia apenas dados básicos: material deve sobreviver.
  await call('/musicas/7', 'PUT', { titulo: 'Anterior editada', artista: 'Banda', duracao_segundos: 250 });
  for (const invalid of [{ letra: null }, { cifra: 'x'.repeat(20001) }, { notas: 'x'.repeat(2001) }, { letra_fonte: 'javascript:alert(1)' }, { tom: 42 }, { cifra_fonte: 'https://evil.example/x' }, { duracao_fonte: 'javascript:alert(1)' }]) {
    await call('/musicas/7', 'PUT', { ...song, ...invalid }, 400);
  }
  await stop(); await start();
  const detail = await call('/setlists/4');
  assert.equal(detail.musicas[0].id, 7); assert.equal(detail.musicas[0].posicao, 1);
  assert.equal(detail.duracao_total_segundos, 250);
  for (const [key, value] of Object.entries(material)) assert.equal(detail.musicas[0][key], value);
  assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(app.db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  song = await call('/musicas/7', 'PUT', { ...song, letra: '', cifra: '', notas: '', tom: '', letra_fonte: '' });
  assert.equal(song.letra, ''); assert.equal(song.cifra, '');
});
