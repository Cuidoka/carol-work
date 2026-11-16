import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.mjs';
import { duration } from '../lib/format.mjs';
import { Button } from './Button.jsx';

export default function LyricsSearch({ title, artist, hasLyrics, disabled, onUse }) {
  const [results, setResults] = useState(null), [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const sequence = useRef(0);
  useEffect(() => {
    sequence.current++; setResults(null); setSelected(null); setLoading(false); setError('');
    return () => { sequence.current++; };
  }, [title, artist]);
  async function search() {
    const request = ++sequence.current;
    setLoading(true); setError(''); setSelected(null); setResults(null);
    try {
      const records = await api(`/letras?${new URLSearchParams({ titulo: title.trim(), artista: artist.trim() })}`);
      if (request === sequence.current) setResults(records);
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setLoading(false); }
  }
  return <div className="import-tool">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xs font-semibold">Encontre a letra</h3><p className="mt-1 text-[11px] leading-5 text-muted">Busca por título e artista no LRCLIB. Confira a versão antes de usar.</p></div><Button icon="search" disabled={disabled || loading || !title.trim() || !artist.trim()} onClick={search}>{loading ? 'Buscando…' : 'Buscar letra'}</Button></div>
    <div aria-live="polite">{error && <p role="alert" className="mt-3 text-xs leading-6 text-red-800">{error}</p>}{loading && <p role="status" className="mt-3 text-xs text-muted">Consultando o catálogo…</p>}{results?.length === 0 && <p className="mt-3 text-xs leading-6 text-muted">Nenhuma letra disponível para essa busca. Tente outro título/artista ou cole a letra abaixo.</p>}</div>
    {!!results?.length && <div className="mt-4"><p className="mb-2 text-[11px] text-muted">Escolha uma versão para revisar:</p><div className="max-h-40 space-y-2 overflow-y-auto">{results.map(item => <button type="button" key={item.id} disabled={disabled} aria-pressed={selected?.id === item.id} onClick={() => setSelected(item)} className={`w-full rounded-lg border bg-white p-3 text-left text-xs ${selected?.id === item.id ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-accent'}`}><strong className="block">{item.titulo} · {item.artista}</strong><span className="mt-1 block text-[11px] text-muted">{item.album || 'Álbum não informado'}{item.duracao_segundos ? ` · ${duration(item.duracao_segundos)}` : ''}</span></button>)}</div></div>}
    {selected && <div className="mt-4 border-t border-line pt-3"><p className="mb-2 text-[11px] font-semibold">Prévia da letra selecionada</p><pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-sans text-xs leading-6">{selected.letra}</pre><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><a className="text-xs underline underline-offset-4" href={selected.fonte} target="_blank" rel="noreferrer">Fonte: LRCLIB</a><Button disabled={disabled} icon="check" onClick={() => { onUse(selected); setSelected(null); setResults(null); }}>{hasLyrics ? 'Substituir pela letra selecionada' : 'Usar esta letra'}</Button></div><p className="mt-2 text-[10px] text-muted">A letra só será gravada quando você salvar a música.</p></div>}
  </div>;
}
