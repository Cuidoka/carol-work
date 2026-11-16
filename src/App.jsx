import { useEffect, useState, useTransition } from 'react';
import Icon from './components/Icon.jsx';
import { Button } from './components/Button.jsx';
import Dialog from './components/Dialog.jsx';
import EditorDialog from './components/EditorDialog.jsx';
import Library from './components/Library.jsx';
import Rehearsal from './components/Rehearsal.jsx';
import Setlists from './components/Setlists.jsx';
import BackupDialog from './components/BackupDialog.jsx';
import PrintSetlist from './components/PrintSetlist.jsx';
import Reveal from './components/Reveal.jsx';
import { useSetlistData } from './hooks/useSetlistData.js';
import { api } from './lib/api.mjs';

export default function App() {
  const data = useSetlistData();
  const [view, setView] = useState('setlists');
  const [editor, setEditor] = useState(null);
  const [rehearsal, setRehearsal] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');
  const [backupOpen, setBackupOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const disabled = data.busy || data.loading || data.refreshing || !data.hasLoaded;
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  const openSong = item => setEditor({ type: 'song', item: item || null });
  const openSetlist = item => setEditor({ type: 'setlist', item: item || null });
  const askDelete = (type, item) => { setDeleteError(''); setDeletion({ type, item }); };

  async function save(values) {
    const current = editor;
    await data.mutate(async () => {
      const route = `/${current.type === 'song' ? 'musicas' : 'setlists'}${current.item ? `/${current.item.id}` : ''}`;
      const result = await api(route, current.item ? 'PUT' : 'POST', values);
      // Fecha depois da escrita: uma falha na releitura não reenvia o cadastro.
      setEditor(null);
      await data.reload(current.type === 'setlist' ? result.id : undefined);
    });
    setToast(current.type === 'song' ? 'Música salva na biblioteca.' : 'Repertório salvo.');
  }
  async function restoreBackup(backup) {
    await data.mutate(async () => {
      const result = await api('/backup', 'POST', backup);
      // Fecha após confirmar a escrita para não repetir importação se a releitura falhar.
      setBackupOpen(false);
      setToast(`Backup restaurado: ${result.musicas} músicas e ${result.setlists} repertórios adicionados.`);
      await data.reload(result.setlist_ids[0]);
    });
  }
  async function confirmDelete() {
    setDeleteError('');
    try {
      await data.mutate(async () => {
        await api(`/${deletion.type === 'song' ? 'musicas' : 'setlists'}/${deletion.item.id}`, 'DELETE');
        setDeletion(null);
        await data.reload();
      });
      setToast(deletion.type === 'song' ? 'Música excluída.' : 'Repertório excluído. Músicas preservadas.');
    } catch (error) { setDeleteError(error.message); }
  }
  async function change(task, message) {
    try { await data.mutate(async () => { await task(); await data.reload(); }); setToast(message); return true; }
    catch (error) { data.setError(error.message); return false; }
  }
  async function move(songId, direction) {
    const ids = data.detail.musicas.map(song => song.id);
    const from = ids.indexOf(songId), to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await change(() => api(`/setlists/${data.selectedId}/ordem`, 'PUT', { musica_ids: ids }), 'Ordem do repertório salva.');
  }
  const navigation = [{ id: 'setlists', label: 'Repertórios' }, { id: 'library', label: 'Biblioteca' }];
  return <><div className="app-shell" aria-busy={data.loading || data.busy}>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header className="app-header"><div className="header-inner">
      <a href="/" className="brand" aria-label="SETLIST, início">SETLIST<span>/</span></a>
      <nav aria-label="Navegação principal">{navigation.map(item => <button key={item.id} id={`nav-${item.id}`} type="button" aria-pressed={view === item.id} disabled={data.busy} onClick={() => startTransition(() => setView(item.id))}>{item.label}</button>)}</nav>
      <div className="header-utilities"><span role="status" className="sync-status">{!data.loading && (data.refreshing || pending) ? 'Atualizando…' : ''}</span><Button variant="quiet" disabled={disabled} onClick={() => setBackupOpen(true)}>Backup <Icon name="arrow" size={13} /></Button></div>
    </div></header>
    <main id="main-content" className="workspace">
        {data.error && <div role="alert" className="app-error"><span><Icon name="alert" size={16} />{data.error}</span><Button disabled={data.busy || data.refreshing} onClick={() => data.reload().catch(() => {})}>Tentar novamente</Button></div>}
        {data.loading ? <div role="status" className="loading-state"><span className="loading-mark" aria-hidden="true" />Carregando sua biblioteca…</div> : !data.hasLoaded ? <section className="empty-state"><h1>Biblioteca indisponível</h1><p>Ainda não foi possível consultar os dados. Use “Tentar novamente” para carregar sua biblioteca.</p></section> : <Reveal key={view} className="workspace-view">{view === 'library'
          ? <Library onRead={song => setRehearsal({ songs: [song], initialId: song.id })} songs={data.songs} disabled={disabled} onNew={() => openSong()} onEdit={openSong} onDelete={item => askDelete('song', item)} />
          : <Setlists onPrint={() => window.print()} onRehearse={initialId => setRehearsal({ songs: data.detail.musicas, name: data.detail.nome, initialId })} songs={data.songs} setlists={data.setlists} selectedId={data.selectedId} detail={data.detail} disabled={disabled} onSelect={data.selectSetlist} onNew={() => openSetlist()} onNewSong={() => openSong()} onEdit={() => openSetlist(data.detail)} onDelete={() => askDelete('setlist', data.detail)} onAdd={songId => change(() => api(`/setlists/${data.selectedId}/musicas`, 'POST', { musica_id: songId }), 'Música adicionada ao repertório.')} onRemove={songId => change(() => api(`/setlists/${data.selectedId}/musicas/${songId}`, 'DELETE'), 'Música removida do repertório. Mantida na biblioteca.')} onMove={move} />}</Reveal>}
    </main>
    <footer className="app-footer"><span>Biblioteca & repertórios</span><span>SETLIST / 2026</span></footer>
    {rehearsal && <Rehearsal {...rehearsal} onClose={() => setRehearsal(null)} onEdit={song => { setRehearsal(null); openSong(song); }} />}
    {editor && <EditorDialog editor={editor} busy={data.busy} onClose={() => { if (!data.busy) setEditor(null); }} onSave={save} />}
    {backupOpen && <BackupDialog busy={data.busy} onClose={() => setBackupOpen(false)} onRestore={restoreBackup} />}
    {deletion && <Dialog title={deletion.type === 'song' ? 'Excluir música?' : 'Excluir repertório?'} busy={data.busy} onClose={() => setDeletion(null)}><p className="text-sm leading-7 text-muted">{deletion.type === 'song' ? `“${deletion.item.titulo}” será excluída da biblioteca e de todos os repertórios em que aparece.` : `“${deletion.item.nome}” será excluído. As músicas continuarão na biblioteca.`} Esta ação não pode ser desfeita.</p>{deleteError && <p role="alert" className="form-error">{deleteError}</p>}<div className="dialog-actions"><Button autoFocus onClick={() => setDeletion(null)} disabled={data.busy}>Cancelar</Button><Button variant="danger" onClick={confirmDelete} disabled={data.busy}>{data.busy ? 'Excluindo…' : 'Excluir'}</Button></div></Dialog>}
    <div role="status" aria-live="polite" className="toast-region">{toast && <div className="toast-enter"><Icon name="check" size={16} />{toast}</div>}</div>
  </div><PrintSetlist detail={data.detail} /></>;
}
