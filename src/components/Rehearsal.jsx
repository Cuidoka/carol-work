import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import Icon from './Icon.jsx';
import { duration } from '../lib/format.mjs';

export default function Rehearsal({ songs, name, initialId, onClose, onEdit }) {
  const [index, setIndex] = useState(Math.max(0, songs.findIndex(song => song.id === initialId)));
  const [tab, setTab] = useState(() => songs[Math.max(0, songs.findIndex(song => song.id === initialId))]?.cifra ? 'cifra' : 'letra');
  const [font, setFont] = useState(20), [scrolling, setScrolling] = useState(false);
  const reader = useRef(null);
  const song = songs[index];
  const content = song?.[tab] || '';
  const elapsed = songs.slice(0, index).reduce((sum, item) => sum + item.duracao_segundos, 0);
  function go(next) { setIndex(Math.max(0, Math.min(songs.length - 1, next))); }
  useEffect(() => { reader.current?.scrollTo(0, 0); setScrolling(false); }, [index, tab]);
  useEffect(() => {
    function key(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setIndex(current => Math.min(songs.length - 1, current + 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(current => Math.max(0, current - 1)); }
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [songs.length]);
  useEffect(() => {
    if (!scrolling) return;
    const timer = setInterval(() => {
      const el = reader.current;
      if (!el || el.scrollTop + el.clientHeight >= el.scrollHeight - 1) { setScrolling(false); return; }
      el.scrollTop += 1;
    }, 50);
    return () => clearInterval(timer);
  }, [scrolling]);
  return <Dialog closeLabel="Sair do ensaio" wide title="Modo de ensaio" eyebrow={name || 'SUA MÚSICA, EM FOCO'} onClose={onClose} className="rehearsal-dialog">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5"><div className="min-w-0"><p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">Faixa {index + 1} de {songs.length} · início em {duration(elapsed)}</p><h3 className="break-words text-2xl font-semibold">{song.titulo}</h3><p className="mt-1 text-sm text-muted">{song.artista}</p></div><div className="flex gap-2"><span className="material-badge"><Icon name="music" size={13} />{song.tom ? `Tom ${song.tom}` : 'Tom livre'}</span><span className="material-badge"><Icon name="clock" size={13} />{duration(song.duracao_segundos)}</span></div></div>
    <div className="my-4 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-lg bg-canvas p-1" aria-label="Material de ensaio">{[['cifra', 'Cifra'], ['letra', 'Letra']].map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded-md px-4 py-2 text-xs font-semibold ${tab === id ? 'bg-white shadow-sm' : 'text-muted'}`}>{label}</button>)}</div><div className="flex items-center gap-2"><Button aria-label="Diminuir fonte" onClick={() => setFont(current => Math.max(14, current - 2))} disabled={font <= 14}>A−</Button><Button aria-label="Aumentar fonte" onClick={() => setFont(current => Math.min(30, current + 2))} disabled={font >= 30}>A+</Button><Button aria-pressed={scrolling} disabled={!content} icon={scrolling ? 'pause' : 'down'} onClick={() => setScrolling(current => !current)}>{scrolling ? 'Pausar' : 'Rolar'}</Button></div></div>
    <div ref={reader} tabIndex={0} aria-label={`Leitura de ${tab}`} className={`reader reader-size-${font} ${tab === 'cifra' ? 'reader-chords' : ''}`}>
      {content ? <pre key={`${song.id}-${tab}`} className="whitespace-pre-wrap break-words font-inherit leading-[1.9]">{content}</pre> : <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center"><Icon name="book" size={32} className="text-[#8ba165]" /><h4 className="text-lg font-semibold">{tab === 'cifra' ? 'Esta música ainda não tem cifra' : 'Esta música ainda não tem letra'}</h4><p className="max-w-sm text-xs leading-6 text-muted">Adicione o material na edição da música para acompanhar o ensaio por aqui.</p><Button icon="edit" onClick={() => onEdit(song)}>Adicionar {tab}</Button></div>}
    </div>
    {tab === 'letra' && song.letra_fonte && <a className="mt-2 inline-block text-[11px] text-muted underline underline-offset-4" href={song.letra_fonte} target="_blank" rel="noreferrer">Origem da letra: LRCLIB</a>}
    {song.notas && <aside className="mt-4 rounded-xl border border-[#e3e9d3] bg-[#f6f9ec] p-4"><h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#6f8053]">Notas de ensaio</h4><p className="whitespace-pre-wrap break-words text-xs leading-6">{song.notas}</p></aside>}
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4"><Button disabled={index === 0} onClick={() => go(index - 1)}>← Anterior</Button><span className="hidden text-[11px] text-muted sm:block">Use ← e → para trocar de faixa</span><Button variant="primary" disabled={index === songs.length - 1} onClick={() => go(index + 1)}>Próxima →</Button></div>
  </Dialog>;
}
