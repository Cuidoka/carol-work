import material from '../../lib/song-material.cjs';
import lyrics from '../../lib/lyrics.cjs';

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
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) {
    throw new HttpError(400, 'O identificador deve ser um inteiro positivo.');
  }
  return Number(value);
}
async function readJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Envie os dados como application/json.');
  }
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 262144) { await reader.cancel(); throw new HttpError(413, 'Os dados excedem o limite de 256 KB.'); }
      chunks.push(value);
    }
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new HttpError(400, 'Envie um objeto JSON válido.'); }
}
function songData(data) {
  const values = [text(data.titulo, 'Título'), text(data.artista, 'Artista')];
  if (!Number.isInteger(data.duracao_segundos) || data.duracao_segundos < 1 || data.duracao_segundos > 36000) {
    throw new HttpError(400, 'A duração deve ser um inteiro entre 1 e 36.000 segundos.');
  }
  return [...values, data.duracao_segundos];
}
const json = (data, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});
const defaultSearch = lyrics.createLyricsSearch();

// Um cliente/uma transação lógica por requisição. Nenhum estado de dados em memória.
export function createHandler(client, options = {}) {
  const searchLyrics = options.lyricsFetch ? lyrics.createLyricsSearch(options.lyricsFetch) : defaultSearch;
  return async request => {
    let tx;
    try {
      const url = new URL(request.url);
      const route = url.pathname;
      const method = request.method;
      if (route === '/api/letras' && method === 'GET') return json(await searchLyrics(url.searchParams));
      if (!route.startsWith('/api/')) throw new HttpError(404, 'Rota não encontrada.');
      const data = ['POST', 'PUT'].includes(method) ? await readJson(request) : null;
      tx = await client.connect();
      const execute = (sql, args = []) => tx.query(sql, args);
      await execute(method === 'GET' ? 'BEGIN READ ONLY' : 'BEGIN');
      const song = async songId => {
        const result = await execute('SELECT * FROM musicas WHERE id = $1', [songId]);
        if (!result.rows[0]) throw new HttpError(404, 'Música não encontrada.');
        return result.rows[0];
      };
      const setlist = async setlistId => {
        // Serializa alterações da mesma setlist entre instâncias serverless.
        const result = await execute('SELECT * FROM setlists WHERE id = $1' + (method === 'GET' ? '' : ' FOR UPDATE'), [setlistId]);
        if (!result.rows[0]) throw new HttpError(404, 'Repertório não encontrado.');
        return result.rows[0];
      };
      const details = async setlistId => {
        const item = await setlist(setlistId);
        const result = await execute(`SELECT m.*, sm.posicao FROM setlist_musicas AS sm
          INNER JOIN musicas AS m ON m.id = sm.musica_id
          WHERE sm.setlist_id = $1 ORDER BY sm.posicao, sm.id`, [setlistId]);
        return { ...item, musicas: result.rows, quantidade_musicas: result.rows.length,
          duracao_total_segundos: result.rows.reduce((sum, item) => sum + item.duracao_segundos, 0) };
      };
      const finish = async (result, status = 200) => {
        await execute('COMMIT');
        return json(result, status);
      };
      if (route === '/api/musicas') {
        if (method === 'GET') return await finish((await execute('SELECT * FROM musicas ORDER BY lower(titulo), id')).rows);
        if (method === 'POST') {
          const result = await execute('INSERT INTO musicas (titulo, artista, duracao_segundos, letra, cifra, tom, notas, letra_fonte) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [...songData(data), ...material.materialData(data)]);
          return await finish(await song(result.rows[0].id), 201);
        }
      }
      let match = route.match(/^\/api\/musicas\/([^/]+)$/);
      if (match && ['PUT', 'DELETE'].includes(method)) {
        const songId = id(match[1]);
        const current = await song(songId);
        if (method === 'PUT') {
          await execute('UPDATE musicas SET titulo = $1, artista = $2, duracao_segundos = $3, letra = $4, cifra = $5, tom = $6, notas = $7, letra_fonte = $8 WHERE id = $9', [...songData(data), ...material.materialData(data, current), songId]);
          return await finish(await song(songId));
        }
        await execute('DELETE FROM musicas WHERE id = $1', [songId]);
        return await finish({ mensagem: 'Música excluída.' });
      }
      if (route === '/api/setlists') {
        if (method === 'GET') return await finish((await execute(`SELECT s.*, COUNT(sm.id)::integer AS quantidade_musicas,
          COALESCE(SUM(m.duracao_segundos), 0)::double precision AS duracao_total_segundos
          FROM setlists AS s LEFT JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
          LEFT JOIN musicas AS m ON m.id = sm.musica_id GROUP BY s.id ORDER BY s.id DESC`)).rows);
        if (method === 'POST') {
          const result = await execute('INSERT INTO setlists (nome, evento) VALUES ($1, $2) RETURNING id', [text(data.nome, 'Nome'), text(data.evento, 'Evento', true)]);
          return await finish(await details(result.rows[0].id), 201);
        }
      }
      match = route.match(/^\/api\/setlists\/([^/]+)$/);
      if (match && ['GET', 'PUT', 'DELETE'].includes(method)) {
        const setlistId = id(match[1]);
        await setlist(setlistId);
        if (method === 'GET') return await finish(await details(setlistId));
        if (method === 'PUT') {
          await execute('UPDATE setlists SET nome = $1, evento = $2 WHERE id = $3', [text(data.nome, 'Nome'), text(data.evento, 'Evento', true), setlistId]);
          return await finish(await details(setlistId));
        }
        await execute('DELETE FROM setlists WHERE id = $1', [setlistId]);
        return await finish({ mensagem: 'Repertório excluído.' });
      }
      match = route.match(/^\/api\/setlists\/([^/]+)\/musicas(?:\/([^/]+))?$/);
      if (match && ((method === 'POST' && !match[2]) || (method === 'DELETE' && match[2]))) {
        const setlistId = id(match[1]);
        await setlist(setlistId);
        if (method === 'POST') {
          if (typeof data.musica_id !== 'number') throw new HttpError(400, 'musica_id deve ser um inteiro positivo.');
          const songId = id(data.musica_id);
          await song(songId);
          if ((await execute('SELECT id FROM setlist_musicas WHERE setlist_id = $1 AND musica_id = $2', [setlistId, songId])).rows.length) {
            throw new HttpError(409, 'Esta música já está no repertório.');
          }
          await execute(`INSERT INTO setlist_musicas (setlist_id, musica_id, posicao)
            VALUES ($1, $2, (SELECT COALESCE(MAX(posicao), 0) + 1 FROM setlist_musicas WHERE setlist_id = $1))`, [setlistId, songId]);
          return await finish(await details(setlistId), 201);
        }
        const result = await execute('DELETE FROM setlist_musicas WHERE setlist_id = $1 AND musica_id = $2', [setlistId, id(match[2])]);
        if (!result.rowCount) throw new HttpError(404, 'Esta música não está no repertório.');
        return await finish(await details(setlistId));
      }
      match = route.match(/^\/api\/setlists\/([^/]+)\/ordem$/);
      if (match && method === 'PUT') {
        const setlistId = id(match[1]);
        const current = (await details(setlistId)).musicas.map(item => item.id);
        const ids = data.musica_ids;
        if (!Array.isArray(ids) || ids.length !== current.length || new Set(ids).size !== ids.length ||
          ids.some(songId => !Number.isSafeInteger(songId) || !current.includes(songId))) {
          throw new HttpError(400, 'A ordem deve conter exatamente as músicas do repertório, sem repetições.');
        }
        for (const [index, songId] of ids.entries()) {
          await execute('UPDATE setlist_musicas SET posicao = $1 WHERE setlist_id = $2 AND musica_id = $3', [index + 1, setlistId, songId]);
        }
        return await finish(await details(setlistId));
      }
      throw new HttpError(404, 'Rota não encontrada.');
    } catch (error) {
      if (tx) await tx.query('ROLLBACK').catch(() => {});
      const conflict = error.code === '23505';
      return json({ erro: conflict ? 'Esta música já está no repertório.' : error.status ? error.message : 'Não foi possível acessar o banco. Confira a configuração do servidor.' }, conflict ? 409 : error.status ?? 503);
    } finally { if (tx) await tx.release(); }
  };
}
