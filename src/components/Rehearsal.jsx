import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import Icon from './Icon.jsx';
import { duration } from '../lib/format.mjs';
import { sourceName, sourceURL } from '../../lib/music-sources.mjs';

export default function Rehearsal({ songs, name, initialId, onClose, onEdit }) {
  const [index, setIndex] = useState(Math.max(0, songs.findIndex(song => song.id === initialId)));
  const [tab, setTab] = useState(() => { const first = songs[Math.max(0, songs.findIndex(song => song.id === initialId))]; return first?.cifra || sourceURL(first?.cifra_fonte) ? 'cifra' : 'letra'; });
  const [font, setFont] = useState(20), [scrolling, setScrolling] = useState(false);
  const reader = useRef(null);
  const song = songs[index];
  const chartLink = sourceURL(song?.cifra_fonte);
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
  return <Dialog closeLabel="Sair do ensaio" wide title="Ensaio" eyebrow={name || 'Biblioteca musical'} onClose={onClose} className="rehearsal-dialog">
    <div className="rehearsal-layout">
      <aside className="rehearsal-queue" aria-label="Sequência do ensaio"><p className="eyebrow">Sequência</p>{songs.map((item, position) => <button key={item.id} type="button" aria-pressed={index === position} onClick={() => go(position)}>{String(position + 1).padStart(2, '0')} · {item.titulo}<span className="mono">{duration(item.duracao_segundos)}</span></button>)}</aside>
      <div className="rehearsal-main">
        <label className="rehearsal-mobile-select">Faixa {index + 1} de {songs.length}<select value={index} onChange={event => go(Number(event.target.value))}>{songs.map((item, position) => <option key={item.id} value={position}>{String(position + 1).padStart(2, '0')} · {item.titulo}</option>)}</select></label>
        <div className="rehearsal-title"><div className="min-w-0"><h3>{song.titulo}</h3><p>{song.artista}</p></div><div className="rehearsal-meta mono"><span>{song.tom || 'Tom livre'}</span><span>{duration(song.duracao_segundos)}</span></div></div>
        <div className="rehearsal-tools"><div className="line-tabs" aria-label="Material de ensaio">{[['cifra', 'Cifra'], ['letra', 'Letra']].map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>{chartLink && <a href={chartLink} target="_blank" rel="noopener noreferrer" className="button button-secondary">Abrir cifra no {sourceName(chartLink)} ↗</a>}</div>
        <div ref={reader} tabIndex={0} aria-label={`Leitura de ${tab}`} className={`reader reader-size-${font} ${tab === 'cifra' ? 'reader-chords' : ''}`}>
          {content ? <pre key={`${song.id}-${tab}`} className="whitespace-pre-wrap break-words font-inherit leading-[1.9]">{content}</pre> : <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><h4 className="text-lg font-medium">{tab === 'cifra' ? chartLink ? `Cifra disponível no ${sourceName(chartLink)}` : 'Esta música ainda não tem cifra' : 'Esta música ainda não tem letra'}</h4><p className="max-w-sm text-xs leading-6 text-muted">{tab === 'cifra' && chartLink ? 'Abra a página da cifra pelo botão acima. Seu ensaio continuará aberto.' : 'Adicione o material na edição da música.'}</p><Button icon="edit" onClick={() => onEdit(song)}>{tab === 'cifra' && chartLink ? 'Importar cifra (opcional)' : `Adicionar ${tab}`}</Button></div>}
        </div>
        {tab === 'letra' && song.letra_fonte && <a className="text-[11px] text-muted underline underline-offset-4" href={song.letra_fonte} target="_blank" rel="noreferrer">Origem da letra: LRCLIB</a>}
        {song.notas && <aside className="rehearsal-notes"><h4>Notas de ensaio</h4><p className="whitespace-pre-wrap break-words">{song.notas}</p></aside>}
      </div>
    </div>
    <footer className="rehearsal-footer"><span className="mono">{String(index + 1).padStart(2, '0')} / {String(songs.length).padStart(2, '0')} · início {duration(elapsed)}</span><div className="button-group"><Button aria-label="Diminuir fonte" onClick={() => setFont(current => Math.max(14, current - 2))} disabled={font <= 14}>A−</Button><Button aria-label="Aumentar fonte" onClick={() => setFont(current => Math.min(30, current + 2))} disabled={font >= 30}>A+</Button><Button aria-pressed={scrolling} disabled={!content} icon={scrolling ? 'pause' : 'down'} onClick={() => setScrolling(current => !current)}>{scrolling ? 'Pausar' : 'Rolar'}</Button><Button disabled={index === 0} onClick={() => go(index - 1)}>← Anterior</Button><Button variant="primary" disabled={index === songs.length - 1} onClick={() => go(index + 1)}>Próxima →</Button></div></footer>
  </Dialog>;
}
