'use strict';
const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const seconds = ms => Number.isFinite(ms) && ms >= 500 && ms < 36000500 ? Math.round(ms / 1000) : null;
const clean = value => typeof value === 'string' ? value.trim().slice(0, 120) : '';

function createCatalogSearch(fetcher = fetch) {
  const cache = new Map(), retryAt = {}, pending = new Set();
  return async params => {
    const title = params.get('titulo')?.trim(), artist = params.get('artista')?.trim();
    const provider = params.get('catalogo') || 'itunes';
    if (!title || !artist || title.length > 120 || artist.length > 120) fail(400, 'Informe título e artista para buscar a duração.');
    if (!['itunes', 'musicbrainz'].includes(provider)) fail(400, 'Catálogo inválido.');
    const key = JSON.stringify([provider, title.toLowerCase(), artist.toLowerCase()]);
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return cached.records;
    if (pending.has(provider) || Date.now() < (retryAt[provider] || 0)) fail(429, 'Aguarde alguns segundos antes de consultar esse catálogo novamente.');
    pending.add(provider);
    try {
      const { sourceURL } = await import('./music-sources.mjs');
      let url;
      if (provider === 'itunes') {
        url = new URL('https://itunes.apple.com/search');
        url.search = new URLSearchParams({ term: `${title} ${artist}`, entity: 'song', country: 'BR', limit: '12' });
      } else {
        const escape = value => value.replace(/[\\"]/g, '\\$&');
        url = new URL('https://musicbrainz.org/ws/2/recording/');
        url.search = new URLSearchParams({ query: `recording:"${escape(title)}" AND artist:"${escape(artist)}"`, fmt: 'json', limit: '12' });
      }
      const response = await fetcher(url, { signal: AbortSignal.timeout(10000), redirect: 'error', headers: {
        Accept: 'application/json', 'User-Agent': 'SETLIST/1.0 (https://github.com/Cuidoka/carol-work)'
      } });
      if (response.status === 429 || response.status === 503) {
        const raw = response.headers.get('retry-after');
        const delay = raw && !Number.isFinite(Number(raw)) ? Date.parse(raw) - Date.now() : Number(raw) * 1000;
        retryAt[provider] = Date.now() + Math.max(3000, Number.isFinite(delay) && delay > 0 ? delay : 60000);
        fail(429, 'O catálogo está ocupado. Tente o outro catálogo ou aguarde para repetir.');
      }
      if (!response.ok) fail(502, 'Não foi possível consultar esse catálogo. Tente o outro ou informe a duração manualmente.');
      const raw = await response.text();
      if (raw.length > 2000000) throw new Error('Resposta excessiva');
      const data = JSON.parse(raw);
      const rows = provider === 'itunes' ? data.results : data.recordings;
      if (!Array.isArray(rows)) throw new Error('Resposta inválida');
      const seen = new Set();
      const records = rows.map(row => {
        if (provider === 'itunes') {
          if (row.kind !== 'song' || !Number.isSafeInteger(row.trackId) || row.trackId < 1) return null;
          return { id: `itunes:${row.trackId}`, titulo: clean(row.trackName), artista: clean(row.artistName),
            album: clean(row.collectionName), duracao_segundos: seconds(row.trackTimeMillis),
            fonte: sourceURL(row.trackViewUrl, 'duracao') || `https://music.apple.com/br/song/${row.trackId}` };
        }
        if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(row.id)) return null;
        return { id: `musicbrainz:${row.id}`, titulo: clean(row.title),
          artista: clean((row['artist-credit'] || []).map(item => `${item.name || item.artist?.name || ''}${item.joinphrase || ''}`).join('')),
          album: clean(row.releases?.[0]?.title || row.disambiguation), duracao_segundos: seconds(row.length),
          fonte: `https://musicbrainz.org/recording/${row.id}` };
      }).filter(row => {
        if (!row?.titulo || !row.artista || !row.duracao_segundos || seen.has(row.id)) return false;
        seen.add(row.id); return true;
      }).slice(0, 12);
      if (cache.size >= 40) cache.delete(cache.keys().next().value);
      cache.set(key, { records, until: Date.now() + 180000 });
      return records;
    } catch (error) {
      if (error.status) throw error;
      fail(502, 'O catálogo não respondeu. Tente o outro catálogo ou informe a duração manualmente.');
    } finally {
      pending.delete(provider);
      retryAt[provider] = Math.max(retryAt[provider] || 0, Date.now() + (provider === 'itunes' ? 3100 : 1100));
    }
  };
}
module.exports = { createCatalogSearch };
