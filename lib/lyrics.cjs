'use strict';

// Consulta somente o catálogo fixo. Não recebe URL externa do usuário.
function createLyricsSearch(fetcher = fetch) {
  let retryAt = 0;
  let pending = false;
  return async function search(params) {
    const title = params.get('titulo')?.trim(), artist = params.get('artista')?.trim();
    const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
    if (!title || !artist || title.length > 120 || artist.length > 120) fail(400, 'Informe título e artista para buscar a letra.');
    if (pending || Date.now() < retryAt) fail(429, 'Aguarde um pouco antes de buscar novamente.');
    pending = true;
    try {
      const url = new URL('https://lrclib.net/api/search');
      url.search = new URLSearchParams({ track_name: title, artist_name: artist });
      const response = await fetcher(url, { signal: AbortSignal.timeout(10000), redirect: 'error', headers: {
        'User-Agent': 'SETLIST/1.0 (https://github.com/Cuidoka/carol-work)', Accept: 'application/json'
      } });
      if (response.status === 429) {
        const raw = response.headers.get('retry-after');
        const seconds = Number(raw);
        const delay = raw && !Number.isFinite(seconds) ? Date.parse(raw) - Date.now() : seconds * 1000;
        retryAt = Date.now() + Math.max(1000, Number.isFinite(delay) ? delay : 60000) + Math.random() * 1000;
        fail(429, 'O catálogo atingiu o limite de consultas. Tente mais tarde.');
      }
      if (!response.ok) fail(502, 'O catálogo de letras está indisponível. Você pode preencher a letra manualmente.');
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error('Resposta inválida');
      return records.filter(record => Number.isSafeInteger(record.id) && record.id > 0 &&
        typeof record.plainLyrics === 'string' && record.plainLyrics.trim() && record.plainLyrics.length <= 20000)
        .slice(0, 8).map(record => ({ id: record.id, titulo: String(record.trackName ?? '').slice(0, 120),
          artista: String(record.artistName ?? '').slice(0, 120), album: String(record.albumName ?? '').slice(0, 160),
          duracao_segundos: Number.isFinite(record.duration) ? Math.round(record.duration) : null,
          letra: record.plainLyrics, fonte: `https://lrclib.net/api/get/${record.id}` }));
    } catch (error) {
      if (error.status) throw error;
      fail(502, 'Não foi possível consultar as letras. Verifique a conexão ou preencha manualmente.');
    } finally { pending = false; retryAt = Math.max(retryAt, Date.now() + 500); }
  };
}
module.exports = { createLyricsSearch };
