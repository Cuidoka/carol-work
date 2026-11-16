import { useDeferredValue, useState } from 'react';
import Icon from './Icon.jsx';
import { Button } from './Button.jsx';
import ActionMenu from './ActionMenu.jsx';
import { useListMotion } from '../hooks/useListMotion.js';
import { duration, countSongs } from '../lib/format.mjs';
import { sourceURL } from '../../lib/music-sources.mjs';

function materialLabel(song) {
  if (song.cifra && song.letra) return 'Cifra + letra';
  if (song.cifra) return 'Cifra';
  if (sourceURL(song.cifra_fonte)) return song.letra ? 'Letra + link ↗' : 'Link da cifra ↗';
  return song.letra ? 'Letra' : 'Sem material';
}

export default function Library({ songs, disabled, onNew, onEdit, onDelete, onRead }) {
  const [query, setQuery] = useState(''), [material, setMaterial] = useState('all');
  const deferredQuery = useDeferredValue(query);
  const filtered = songs.filter(song => `${song.titulo} ${song.artista}`.toLocaleLowerCase('pt-BR').includes(deferredQuery.trim().toLocaleLowerCase('pt-BR')) && (material === 'all' || !!song[material] || (material === 'cifra' && !!sourceURL(song.cifra_fonte))));
  const rows = useListMotion(filtered.map(song => song.id));
  return <section aria-label="Biblioteca musical" className="library-page">
    <div className="page-heading"><div><h1>Biblioteca</h1><p>{countSongs(songs.length)} disponíveis para seus repertórios.</p></div><Button id="primary-action" variant="primary" icon="plus" disabled={disabled} onClick={onNew}>Nova música</Button></div>
    <div className="library-toolbar"><label className="search-field"><Icon name="search" size={17} /><input aria-label="Buscar por título ou artista" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar música ou artista" /></label><div className="line-tabs" aria-label="Filtrar por material">{[['all', 'Todas'], ['letra', 'Com letra'], ['cifra', 'Com cifra']].map(([id, label]) => <button type="button" key={id} aria-pressed={material === id} onClick={() => setMaterial(id)}>{label}</button>)}</div></div>
    {filtered.length ? <table className="library-table" aria-busy={query !== deferredQuery}>
      <caption className="sr-only">Músicas cadastradas na biblioteca</caption><colgroup><col className="col-song" /><col className="col-artist" /><col className="col-key" /><col className="col-material" /><col className="col-duration" /><col className="col-actions" /></colgroup>
      <thead><tr><th scope="col">Música</th><th scope="col" className="library-artist">Artista</th><th scope="col" className="library-key">Tom</th><th scope="col" className="library-material">Material</th><th scope="col" className="align-end">Duração</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
      <tbody ref={rows}>{filtered.map(song => <tr key={song.id} data-motion-id={song.id} className="library-row">
        <td><div className="song-title"><button type="button" disabled={disabled} onClick={() => onRead(song)} aria-label={`Abrir ${song.titulo} para ensaio`}>{song.titulo}</button><span className="library-mobile-info">{song.artista}{song.tom ? ` · ${song.tom}` : ''}</span><span className="library-mobile-material">{materialLabel(song)}</span></div></td>
        <td className="library-artist">{song.artista}</td><td className="library-key mono">{song.tom || '—'}</td><td className="library-material">{materialLabel(song)}</td><td className="track-time">{duration(song.duracao_segundos)}</td>
        <td><ActionMenu label={`Ações de ${song.titulo}`} disabled={disabled} actions={[{ label: 'Editar música', icon: 'edit', onClick: () => onEdit(song) }, { label: 'Excluir música', icon: 'trash', danger: true, onClick: () => onDelete(song) }]} /></td>
      </tr>)}</tbody>
    </table> : <div className="empty-state"><h2>{query || material !== 'all' ? 'Nenhuma música encontrada' : 'Sua biblioteca está vazia'}</h2><p>{query || material !== 'all' ? 'Tente outro título, artista ou filtro de material.' : 'Cadastre uma música para começar a montar seus repertórios.'}</p>{!query && material === 'all' && <Button icon="plus" variant="primary" onClick={onNew} disabled={disabled}>Cadastrar primeira música</Button>}</div>}
    <div className="table-footer" aria-live="polite"><span>{query || material !== 'all' ? `${countSongs(filtered.length)} encontradas` : 'Títulos abrem o modo de ensaio.'}</span><span>Biblioteca musical</span></div>
  </section>;
}
