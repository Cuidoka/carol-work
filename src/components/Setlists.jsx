import { useState } from 'react';
import { Button, IconButton } from './Button.jsx';
import Dialog from './Dialog.jsx';
import ActionMenu from './ActionMenu.jsx';
import Reveal from './Reveal.jsx';
import { useListMotion } from '../hooks/useListMotion.js';
import { countSongs, duration } from '../lib/format.mjs';

function SetlistDetail({ detail, songs, disabled, onEdit, onDelete, onNewSong, onAdd, onRemove, onMove, onRehearse, onPrint }) {
  const [adding, setAdding] = useState(false), [selectedSong, setSelectedSong] = useState('');
  const [removing, setRemoving] = useState(null), [removeError, setRemoveError] = useState('');
  const tracks = useListMotion(detail.musicas.map(song => song.id));
  const available = songs.filter(song => !detail.musicas.some(item => item.id === song.id));
  const selectValue = available.some(song => String(song.id) === selectedSong) ? selectedSong : '';
  async function add(event) {
    event.preventDefault();
    if (selectValue && await onAdd(Number(selectValue))) { setSelectedSong(''); setAdding(false); }
  }
  async function remove() {
    setRemoveError('');
    if (await onRemove(removing.id)) setRemoving(null);
    else setRemoveError('Não foi possível remover a faixa. Tente novamente.');
  }
  return <>
    <div className="page-heading"><div className="min-w-0"><h1>{detail.nome}</h1><p>{detail.evento || 'Sem evento definido'} <span aria-hidden="true">·</span> {countSongs(detail.quantidade_musicas)}</p></div><div className="setlist-duration"><span>Duração total</span><strong data-testid="setlist-total">{duration(detail.duracao_total_segundos)}</strong></div></div>
    <div className="setlist-toolbar"><div className="button-group"><Button variant="primary" disabled={disabled || !detail.musicas.length} onClick={() => onRehearse(detail.musicas[0].id)}>Iniciar ensaio <span aria-hidden="true">↗</span></Button><Button icon="plus" disabled={disabled} onClick={() => setAdding(true)}>Adicionar música</Button></div><div className="button-group"><Button variant="quiet" disabled={disabled} onClick={onPrint}>Imprimir / PDF</Button><Button variant="quiet" disabled={disabled} onClick={onEdit}>Editar</Button><ActionMenu label="Mais ações do repertório" disabled={disabled} actions={[{ label: 'Excluir repertório', icon: 'trash', danger: true, onClick: onDelete }]} /></div></div>
    {detail.musicas.length ? <>
      <div aria-hidden="true" className="track-heading"><span>#</span><span>Música / artista</span><span className="track-key">Tom</span><span className="align-end">Tempo</span><span /></div>
      <ol ref={tracks} className="track-list">{detail.musicas.map((song, index) => <li key={song.id} data-motion-id={song.id} className="track-row">
        <span className="track-position">{String(index + 1).padStart(2, '0')}</span>
        <div className="song-title"><button type="button" disabled={disabled} onClick={() => onRehearse(song.id)} aria-label={`Ensaiar ${song.titulo}`}>{song.titulo}</button><span>{song.artista}<span className="mobile-key">{song.tom ? ` · ${song.tom}` : ''}</span></span></div>
        <span className="track-key mono">{song.tom || '—'}</span><span className="track-time">{duration(song.duracao_segundos)}</span>
        <ActionMenu label={`Ações de ${song.titulo}`} disabled={disabled} actions={[
          { label: 'Mover acima', icon: 'up', disabled: index === 0, onClick: () => onMove(song.id, -1) },
          { label: 'Mover abaixo', icon: 'down', disabled: index === detail.musicas.length - 1, onClick: () => onMove(song.id, 1) },
          { label: 'Remover do repertório', icon: 'close', danger: true, onClick: () => { setRemoveError(''); setRemoving(song); } }
        ]} />
      </li>)}</ol><div className="table-footer"><span>Ordem de execução</span><span>Selecione uma faixa para ensaiar ↗</span></div>
    </> : <div className="empty-state"><h2>Repertório sem faixas</h2><p>Adicione músicas da biblioteca para montar a sequência.</p><Button disabled={disabled} onClick={() => setAdding(true)}>Adicionar primeira música</Button></div>}
    {adding && <Dialog title="Adicionar música" eyebrow={detail.nome} busy={disabled} onClose={() => setAdding(false)}>{available.length ? <form onSubmit={add}><label className="field-label" htmlFor="add-track">Música da biblioteca</label><select id="add-track" data-autofocus="true" className="field mt-2" value={selectValue} onChange={event => setSelectedSong(event.target.value)} disabled={disabled} required><option value="">Escolha uma música…</option>{available.map(song => <option key={song.id} value={song.id}>{song.titulo} — {song.artista} ({duration(song.duracao_segundos)})</option>)}</select><div className="dialog-actions"><Button disabled={disabled} onClick={() => setAdding(false)}>Cancelar</Button><Button type="submit" variant="primary" disabled={disabled || !selectValue}>Adicionar ao repertório</Button></div></form> : <><p className="text-sm leading-7 text-muted">{songs.length ? 'Todas as músicas da biblioteca já estão neste repertório.' : 'Sua biblioteca ainda está vazia.'}</p><div className="dialog-actions"><Button disabled={disabled} onClick={() => setAdding(false)}>Fechar</Button><Button variant="primary" disabled={disabled} onClick={() => { setAdding(false); onNewSong(); }}>Cadastrar música</Button></div></>}</Dialog>}
    {removing && <Dialog title="Remover do repertório?" busy={disabled} onClose={() => setRemoving(null)}><p className="text-sm leading-7 text-muted">“{removing.titulo}” sairá deste repertório e continuará disponível na biblioteca.</p>{removeError && <p role="alert" className="form-error">{removeError}</p>}<div className="dialog-actions"><Button autoFocus disabled={disabled} onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="danger" disabled={disabled} onClick={remove}>{disabled ? 'Removendo…' : 'Remover faixa'}</Button></div></Dialog>}
  </>;
}

export default function Setlists({ setlists, selectedId, detail, songs, disabled, onSelect, onNew, ...actions }) {
  const [choosing, setChoosing] = useState(false);
  const list = () => setlists.map(item => <button key={item.id} type="button" className="repertoire-item" aria-pressed={item.id === selectedId} disabled={disabled} onClick={() => { onSelect(item.id); setChoosing(false); }}><strong>{item.nome}</strong><span>{countSongs(item.quantidade_musicas)} <span className="mono">/ {duration(item.duracao_total_segundos)}</span></span></button>);
  return <div className="repertoire-layout">
    <aside className="repertoire-rail" aria-label="Seus repertórios"><div className="rail-heading"><h2>Repertórios</h2><IconButton icon="plus" label="Novo repertório" disabled={disabled} onClick={onNew} /></div>{setlists.length ? list() : <p className="text-xs leading-6 text-muted">Seus repertórios aparecerão aqui.</p>}</aside>
    <section className="repertoire-detail" aria-label="Detalhes do repertório">
      <div className="mobile-repertoire-nav"><Button variant="quiet" disabled={disabled} onClick={() => setChoosing(true)}>← Repertórios</Button><IconButton icon="plus" label="Novo repertório" disabled={disabled} onClick={onNew} /></div>
      {detail ? <Reveal key={detail.id}><SetlistDetail detail={detail} songs={songs} disabled={disabled} {...actions} /></Reveal> : <div className="empty-state"><span className="eyebrow">Repertórios</span><h1>Monte sua sequência</h1><p>Crie um repertório e selecione as músicas para o próximo ensaio ou show.</p><Button id="primary-action" variant="primary" icon="plus" onClick={onNew} disabled={disabled}>Novo repertório</Button></div>}
    </section>
    {choosing && <Dialog title="Seus repertórios" busy={disabled} onClose={() => setChoosing(false)}><div className="repertoire-picker">{list()}</div><div className="dialog-actions"><Button icon="plus" disabled={disabled} onClick={() => { setChoosing(false); onNew(); }}>Novo repertório</Button></div></Dialog>}
  </div>;
}
