'use strict';

const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
const clean = value => typeof value === 'string' ? value.trim().slice(0, 120) : '';
const slug = value => typeof value === 'string' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

// RF-CIFRA-001: sugestões são metadados e links; não contêm o texto da cifra.
// Somente este endpoint fixo é consultado. Nenhuma URL recebida é buscada.
function createChartSearch(fetcher = fetch) {
  const cache = new Map();
  let pending = false, retryAt = 0;
  return async params => {
    const title = params.get('titulo')?.trim(), artist = params.get('artista')?.trim();
    if (!title || !artist || title.length > 120 || artist.length > 120 || /[\u0000-\u001f]/.test(title + artist)) {
      fail(400, 'Informe título e artista com até 120 caracteres para buscar no Cifra Club.');
    }
    const key = JSON.stringify([title.toLowerCase(), artist.toLowerCase()]);
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return cached.records;
    if (pending || Date.now() < retryAt) fail(429, 'Aguarde alguns segundos antes de buscar no Cifra Club novamente.');
    pending = true;
    try {
      const url = new URL('https://solr.sscdn.co/cifraclub-explore/v1/search/suggest');
      url.search = new URLSearchParams({ q: `${title} ${artist}`, lang: 'pt' });
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(10000), redirect: 'error',
        headers: { Accept: 'application/json', 'User-Agent': 'SETLIST/1.0 (https://github.com/Cuidoka/carol-work)' }
      });
      if (response.status === 429) {
        const raw = response.headers.get('retry-after');
        const delay = raw && !Number.isFinite(Number(raw)) ? Date.parse(raw) - Date.now() : Number(raw) * 1000;
        retryAt = Date.now() + Math.min(3600000, Math.max(1000, Number.isFinite(delay) && delay > 0 ? delay : 60000));
        fail(429, 'O Cifra Club atingiu o limite de consultas. Aguarde antes de tentar novamente.');
      }
      if (!response.ok) fail(502, 'O Cifra Club está indisponível. Use a busca externa ou importe a cifra manualmente.');
      const raw = await response.text();
      if (raw.length > 2000000) throw new Error('Resposta excessiva');
      const data = JSON.parse(raw);
      if (!Array.isArray(data?.results)) throw new Error('Resposta inválida');
      const records = [], seen = new Set();
      for (const row of data.results) {
        if (row?.type !== 'song' || !slug(row.slug) || !slug(row.artist?.slug)) continue;
        const titulo = clean(row.name), artista = clean(row.artist?.name);
        const fonte = `https://www.cifraclub.com.br/${row.artist.slug}/${row.slug}/`;
        if (!titulo || !artista || seen.has(fonte)) continue;
        seen.add(fonte);
        records.push({ id: fonte, titulo, artista, fonte });
        if (records.length === 12) break;
      }
      if (cache.size >= 40) cache.delete(cache.keys().next().value);
      cache.set(key, { records, until: Date.now() + 180000 });
      return records;
    } catch (error) {
      if (error.status) throw error;
      fail(502, 'Não foi possível consultar o Cifra Club. Tente novamente ou importe a cifra manualmente.');
    } finally { pending = false; retryAt = Math.max(retryAt, Date.now() + 1000); }
  };
}

module.exports = { createChartSearch };
