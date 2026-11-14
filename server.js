'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { serveStatic } = require('./lib/static.cjs');
const { materialData } = require('./lib/song-material.cjs');
const { createLyricsSearch } = require('./lib/lyrics.cjs');

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function text(value, label, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > 120) {
    throw new HttpError(400, `${label}: informe ${optional ? 'até 120 caracteres' : 'de 1 a 120 caracteres'}.`);
  }
  return value.trim();
}

function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(400, 'O identificador deve ser um inteiro positivo.');
  }
  return Number(value);
}

async function readJson(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Envie os dados como application/json.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size <= 262144) chunks.push(chunk);
  }
  if (size > 262144) throw new HttpError(413, 'Os dados enviados excedem o limite de 256 KB.');
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new HttpError(400, 'O corpo da requisição deve ser um objeto JSON válido.'); }
}

function createApp(options = {}) {
  const dbPath = options.dbPath ?? process.env.SETLIST_DB_PATH ?? path.join(__dirname, 'dados', 'setlist.sqlite');
  const isNew = dbPath === ':memory:' || !fs.existsSync(dbPath);
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8'));
  db.exec('PRAGMA busy_timeout = 5000');
  // Migração aditiva e transacional: conserva IDs, registros e vínculos antigos.
  const columns = new Set(db.prepare('PRAGMA table_info(musicas)').all().map(column => column.name));
  db.exec('BEGIN');
  try {
    for (const [name, limit] of Object.entries({ letra: 20000, cifra: 20000, tom: 12, notas: 2000, letra_fonte: 120 })) {
      if (!columns.has(name)) db.exec(`ALTER TABLE musicas ADD COLUMN ${name} TEXT NOT NULL DEFAULT '' CHECK (length(${name}) <= ${limit})`);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  const searchLyrics = createLyricsSearch(options.lyricsFetch);

  function transaction(action) {
    db.exec('BEGIN');
    try { const result = action(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }

  // Exemplos somente no primeiro banco. Uma biblioteca esvaziada continua vazia.
  if (isNew && (options.seed ?? process.env.SETLIST_SEED !== '0')) {
    transaction(() => {
      const insert = db.prepare('INSERT INTO musicas (titulo, artista, duracao_segundos) VALUES (?, ?, ?)');
      const songs = [
        ['Entre Estrelas', 'Banda Aurora', 243], ['Maré Alta', 'Os Navegantes', 215],
        ['Luzes da Cidade', 'Banda Aurora', 198], ['Caminho de Casa', 'Clara Sol', 265],
        ['Último Acorde', 'Trio Horizonte', 187]
      ].map(song => Number(insert.run(...song).lastInsertRowid));
      const setlistId = Number(db.prepare('INSERT INTO setlists (nome, evento) VALUES (?, ?)')
        .run('Show de estreia', 'Festival do Campus').lastInsertRowid);
      songs.slice(0, 3).forEach((song, index) => db.prepare(
        'INSERT INTO setlist_musicas (setlist_id, musica_id, posicao) VALUES (?, ?, ?)'
      ).run(setlistId, song, index + 1));
    });
  }

  function requireSong(songId) {
    const song = db.prepare('SELECT * FROM musicas WHERE id = ?').get(songId);
    if (!song) throw new HttpError(404, 'Música não encontrada.');
    return song;
  }
  function requireSetlist(setlistId) {
    const setlist = db.prepare('SELECT * FROM setlists WHERE id = ?').get(setlistId);
    if (!setlist) throw new HttpError(404, 'Repertório não encontrado.');
    return setlist;
  }
  function details(setlistId) {
    const setlist = requireSetlist(setlistId);
    const songs = db.prepare(`SELECT m.*, sm.posicao
      FROM setlist_musicas AS sm INNER JOIN musicas AS m ON m.id = sm.musica_id
      WHERE sm.setlist_id = ? ORDER BY sm.posicao, sm.id`).all(setlistId);
    return { ...setlist, musicas: songs, quantidade_musicas: songs.length,
      duracao_total_segundos: songs.reduce((sum, song) => sum + song.duracao_segundos, 0) };
  }
  function songData(data) {
    const title = text(data.titulo, 'Título');
    const artist = text(data.artista, 'Artista');
    if (!Number.isInteger(data.duracao_segundos) || data.duracao_segundos < 1 || data.duracao_segundos > 36000) {
      throw new HttpError(400, 'A duração deve ser um inteiro entre 1 e 36.000 segundos.');
    }
    return [title, artist, data.duracao_segundos];
  }

  function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const url = new URL(req.url, 'http://localhost');
      const route = url.pathname;
      const method = req.method;
      if (route === '/api/letras' && method === 'GET') return json(res, 200, await searchLyrics(url.searchParams));
      if (route === '/api/musicas') {
        if (method === 'GET') return json(res, 200, db.prepare('SELECT * FROM musicas ORDER BY titulo COLLATE NOCASE, id').all());
        if (method === 'POST') {
          const data = await readJson(req);
          const values = [...songData(data), ...materialData(data)];
          const result = db.prepare('INSERT INTO musicas (titulo, artista, duracao_segundos, letra, cifra, tom, notas, letra_fonte) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(...values);
          return json(res, 201, requireSong(Number(result.lastInsertRowid)));
        }
      }
      let match = route.match(/^\/api\/musicas\/([^/]+)$/);
      if (match && ['PUT', 'DELETE'].includes(method)) {
        const songId = id(match[1]);
        const current = requireSong(songId);
        if (method === 'PUT') {
          const data = await readJson(req);
          const values = [...songData(data), ...materialData(data, current)];
          db.prepare('UPDATE musicas SET titulo = ?, artista = ?, duracao_segundos = ?, letra = ?, cifra = ?, tom = ?, notas = ?, letra_fonte = ? WHERE id = ?').run(...values, songId);
          return json(res, 200, requireSong(songId));
        }
        db.prepare('DELETE FROM musicas WHERE id = ?').run(songId);
        return json(res, 200, { mensagem: 'Música excluída.' });
      }
      if (route === '/api/setlists') {
        if (method === 'GET') return json(res, 200, db.prepare(`SELECT s.*,
          COUNT(sm.id) AS quantidade_musicas, COALESCE(SUM(m.duracao_segundos), 0) AS duracao_total_segundos
          FROM setlists AS s LEFT JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
          LEFT JOIN musicas AS m ON m.id = sm.musica_id
          GROUP BY s.id ORDER BY s.id DESC`).all());
        if (method === 'POST') {
          const data = await readJson(req);
          const result = db.prepare('INSERT INTO setlists (nome, evento) VALUES (?, ?)')
            .run(text(data.nome, 'Nome'), text(data.evento, 'Evento', true));
          return json(res, 201, details(Number(result.lastInsertRowid)));
        }
      }
      match = route.match(/^\/api\/setlists\/([^/]+)$/);
      if (match && ['GET', 'PUT', 'DELETE'].includes(method)) {
        const setlistId = id(match[1]);
        requireSetlist(setlistId);
        if (method === 'GET') return json(res, 200, details(setlistId));
        if (method === 'PUT') {
          const data = await readJson(req);
          db.prepare('UPDATE setlists SET nome = ?, evento = ? WHERE id = ?')
            .run(text(data.nome, 'Nome'), text(data.evento, 'Evento', true), setlistId);
          return json(res, 200, details(setlistId));
        }
        db.prepare('DELETE FROM setlists WHERE id = ?').run(setlistId);
        return json(res, 200, { mensagem: 'Repertório excluído.' });
      }
      match = route.match(/^\/api\/setlists\/([^/]+)\/musicas(?:\/([^/]+))?$/);
      if (match && ((method === 'POST' && !match[2]) || (method === 'DELETE' && match[2]))) {
        const setlistId = id(match[1]);
        requireSetlist(setlistId);
        if (method === 'POST') {
          const data = await readJson(req);
          if (typeof data.musica_id !== 'number') throw new HttpError(400, 'musica_id deve ser um inteiro positivo.');
          const songId = id(data.musica_id);
          requireSong(songId);
          if (db.prepare('SELECT id FROM setlist_musicas WHERE setlist_id = ? AND musica_id = ?').get(setlistId, songId)) {
            throw new HttpError(409, 'Esta música já está no repertório.');
          }
          db.prepare(`INSERT INTO setlist_musicas (setlist_id, musica_id, posicao)
            VALUES (?, ?, (SELECT COALESCE(MAX(posicao), 0) + 1 FROM setlist_musicas WHERE setlist_id = ?))`)
            .run(setlistId, songId, setlistId);
          return json(res, 201, details(setlistId));
        }
        const result = db.prepare('DELETE FROM setlist_musicas WHERE setlist_id = ? AND musica_id = ?').run(setlistId, id(match[2]));
        if (!result.changes) throw new HttpError(404, 'Esta música não está no repertório.');
        return json(res, 200, details(setlistId));
      }
      match = route.match(/^\/api\/setlists\/([^/]+)\/ordem$/);
      if (match && method === 'PUT') {
        const setlistId = id(match[1]);
        const current = details(setlistId).musicas.map(song => song.id);
        const { musica_ids: ids } = await readJson(req);
        if (!Array.isArray(ids) || ids.length !== current.length || new Set(ids).size !== ids.length ||
            ids.some(songId => !Number.isSafeInteger(songId) || !current.includes(songId))) {
          throw new HttpError(400, 'A ordem deve conter exatamente as músicas do repertório, sem repetições.');
        }
        transaction(() => ids.forEach((songId, index) => db.prepare(
          'UPDATE setlist_musicas SET posicao = ? WHERE setlist_id = ? AND musica_id = ?'
        ).run(index + 1, setlistId, songId)));
        return json(res, 200, details(setlistId));
      }
      if (route.startsWith('/api/')) throw new HttpError(404, 'Rota não encontrada.');
      if (!serveStatic(req, res)) throw new HttpError(404, 'Página não encontrada.');
    } catch (error) {
      if (!error.status) console.error(error);
      json(res, error.status ?? 500, { erro: error.status ? error.message : 'Não foi possível concluir a operação.' });
    }
  });
  server.on('close', () => db.close());
  return { server, db };
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT inválida.');
  const { server } = createApp();
  server.on('error', error => { console.error(`Não foi possível iniciar: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`SETLIST em http://localhost:${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}

module.exports = { createApp };
