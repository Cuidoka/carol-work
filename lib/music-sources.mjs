const sites = new Map([
  ['cifraclub.com.br', 'Cifra Club'], ['letras.mus.br', 'Letras'],
  ['cifras.com.br', 'Cifras.com.br'], ['e-chords.com', 'E-Chords'],
  ['tabs.ultimate-guitar.com', 'Ultimate Guitar'], ['ultimate-guitar.com', 'Ultimate Guitar'],
  ['lrclib.net', 'LRCLIB'], ['music.apple.com', 'Apple Music / iTunes'],
  ['itunes.apple.com', 'Apple Music / iTunes'], ['musicbrainz.org', 'MusicBrainz']
]);

// URLs são apenas referências. Nenhum endereço fornecido pelo usuário é buscado pelo servidor.
export function sourceURL(value, kind = 'cifra') {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !sites.has(host)) return '';
    if (kind === 'duracao' && !['music.apple.com', 'itunes.apple.com', 'musicbrainz.org', 'lrclib.net'].includes(host)) return '';
    if (host === 'lrclib.net' && !/^\/api\/get\/[1-9]\d*$/.test(url.pathname)) return '';
    if (url.pathname === '/') return '';
    url.hash = '';
    return url.href.length <= 500 ? url.href : '';
  } catch { return ''; }
}

export function sourceName(value) {
  try { return sites.get(new URL(value).hostname.replace(/^www\./, '')) || 'Fonte'; }
  catch { return 'Fonte'; }
}

export function searchLinks(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`.trim());
  return [
    { name: 'Cifra Club', url: `https://www.cifraclub.com.br/?q=${query}` },
    { name: 'Letras', url: `https://www.letras.mus.br/?q=${query}#gsc.tab=0&gsc.q=${query}` }
  ];
}
