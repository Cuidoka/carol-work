import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { api } from '../lib/api.mjs';

export default function ChartSearch({ title, artist, disabled, onUse }) {
  const [results, setResults] = useState(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const sequence = useRef(0);
  useEffect(() => {
    sequence.current++; setResults(null); setLoading(false); setError(''); setNotice('');
    return () => { sequence.current++; };
  }, [title, artist]);
  async function search() {
    const request = ++sequence.current;
    setLoading(true); setError(''); setNotice(''); setResults(null);
    try {
      const records = await api(`/cifras?${new URLSearchParams({ titulo: title.trim(), artista: artist.trim() })}`);
      if (request === sequence.current) setResults(records);
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setLoading(false); }
  }
  return <div className="import-tool">
    <h3 className="text-xs font-semibold">Encontre a cifra no Cifra Club</h3>
    <p className="mt-1 text-[11px] leading-5 text-muted">Informe título e artista em Informações. A busca encontra o link; para ler a cifra aqui, importe o texto nas opções abaixo.</p>
    <Button className="mt-3" icon="search" disabled={disabled || loading || !title.trim() || !artist.trim()} onClick={search}>{loading ? 'Buscando…' : 'Buscar no Cifra Club'}</Button>
    <div aria-live="polite">
      {loading && <p role="status" className="mt-3 text-xs text-muted">Consultando o Cifra Club…</p>}
      {error && <p role="alert" className="mt-3 text-xs leading-5 text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-3 text-xs leading-5 text-accent">{notice}</p>}
      {results?.length === 0 && <p className="mt-3 text-xs leading-5 text-muted">Nenhuma música encontrada. Confira o título e o artista ou use a importação manual abaixo.</p>}
    </div>
    {!!results?.length && <div className="my-3 max-h-56 space-y-2 overflow-y-auto" aria-label="Músicas encontradas no Cifra Club">{results.map(row => <div key={row.id} className="rounded-lg border border-line bg-white p-3">
      <strong className="block text-xs">{row.titulo} · {row.artista}</strong>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <a className="text-[11px] underline" href={row.fonte} target="_blank" rel="noopener noreferrer">Abrir cifra no Cifra Club ↗</a>
        <Button disabled={disabled} onClick={() => { onUse(row); setResults(null); setNotice('Link preenchido. A cifra em texto foi preservada. Salve a música para gravar o link.'); }}>Usar link desta cifra</Button>
      </div>
    </div>)}</div>}
  </div>;
}
