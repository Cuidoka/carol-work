import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { api } from '../lib/api.mjs';
import { duration } from '../lib/format.mjs';
import { sourceName } from '../../lib/music-sources.mjs';

export default function CatalogSearch({ title, artist, disabled, onUse }) {
  const [provider, setProvider] = useState('itunes'), [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const sequence = useRef(0);
  useEffect(() => {
    sequence.current++; setResults(null); setError(''); setLoading(false);
    return () => { sequence.current++; };
  }, [title, artist, provider]);
  async function search() {
    const request = ++sequence.current;
    setLoading(true); setError(''); setResults(null);
    try {
      const rows = await api(`/catalogo?${new URLSearchParams({ titulo: title.trim(), artista: artist.trim(), catalogo: provider })}`);
      if (request === sequence.current) setResults(rows);
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setLoading(false); }
  }
  return <div className="import-tool">
    <h3 className="text-xs font-semibold">Duração do catálogo</h3>
    <p className="mt-1 text-[11px] leading-5 text-muted">Informe título e artista acima. Escolha a gravação para preencher a duração automaticamente.</p>
    <div className="mt-3 flex flex-wrap gap-2"><label className="min-w-0 flex-1 text-[11px] text-muted">Catálogo<select className="field mt-1" value={provider} disabled={disabled || loading} onChange={event => setProvider(event.target.value)}><option value="itunes">Apple Music / iTunes</option><option value="musicbrainz">MusicBrainz</option></select></label><Button className="self-end" icon="search" onClick={search} disabled={disabled || loading || !title.trim() || !artist.trim()}>{loading ? 'Buscando…' : 'Buscar duração'}</Button></div>
    <div aria-live="polite">{error && <p role="alert" className="mt-3 text-xs leading-5 text-red-800">{error}</p>}{results?.length === 0 && <p className="mt-3 text-xs leading-5 text-muted">Nenhuma gravação com duração encontrada. Tente o outro catálogo ou informe manualmente, inclusive para músicas autorais.</p>}</div>
    {!!results?.length && <div className="mt-3 max-h-56 space-y-2 overflow-y-auto" aria-label="Gravações encontradas">{results.map(row => <div key={row.id} className="rounded-lg border border-line bg-white p-3"><strong className="block text-xs">{row.titulo} · {row.artista}</strong><p className="mt-1 text-[11px] text-muted">{row.album || 'Versão sem álbum informado'} · {duration(row.duracao_segundos)}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><a className="text-[11px] underline" href={row.fonte} target="_blank" rel="noreferrer">{sourceName(row.fonte)}</a><Button disabled={disabled} onClick={() => { onUse(row); setResults(null); }}>Usar duração {duration(row.duracao_segundos)}</Button></div></div>)}</div>}
  </div>;
}
