import { useEffect, useState } from 'react';
import Icon from './components/Icon.jsx';
import { Button } from './components/Button.jsx';
import Dialog from './components/Dialog.jsx';
import EditorDialog from './components/EditorDialog.jsx';
import Library from './components/Library.jsx';
import Rehearsal from './components/Rehearsal.jsx';
import Setlists from './components/Setlists.jsx';
import { useSetlistData } from './hooks/useSetlistData.js';
import { api } from './lib/api.mjs';
import { libraryDuration, duration } from './lib/format.mjs';

function Stat({ icon, label, value, title }) {
  return <div className="flex items-center gap-4 px-3 sm:px-6"><span className="hidden size-11 items-center justify-center rounded-xl bg-[#f2f5eb] text-[#6c8052] lg:flex"><Icon name={icon} size={23} /></span><div><span className="block min-h-8 text-[10px] text-muted sm:min-h-0 sm:text-xs">{label}</span><strong title={title} className="mt-1 block text-xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</strong></div></div>;
}

export default function App() {
  const data = useSetlistData();
  const [view, setView] = useState('setlists');
  const [editor, setEditor] = useState(null);
  const [rehearsal, setRehearsal] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');
  const disabled = data.busy || data.loading || data.refreshing || !data.hasLoaded;
  const seconds = data.songs.reduce((sum, song) => sum + song.duracao_segundos, 0);
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
  const navigation = [{ id: 'setlists', label: 'Meus repertórios', icon: 'list', count: data.hasLoaded ? data.setlists.length : '—' }, { id: 'library', label: 'Biblioteca musical', icon: 'music', count: data.hasLoaded ? data.songs.length : '—' }];
  return <div className="min-h-screen" aria-busy={data.loading || data.busy}>
    <aside className="flex flex-col bg-forest px-4 py-5 text-[#eef3ec] md:fixed md:inset-y-0 md:left-0 md:w-56 md:px-5 md:py-8 lg:w-60">
      <a href="/" className="flex items-center gap-3 px-1 text-2xl font-extrabold tracking-wide" aria-label="SETLIST, início"><span className="flex size-10 items-center justify-center rounded-xl bg-acid text-forest"><Icon name="wave" size={26} /></span><span>SETLIST<span className="text-acid">.</span></span></a>
      <p className="mb-4 mt-12 hidden px-3 text-[9px] font-semibold tracking-[.18em] text-[#8c9c92] md:block">SEU ESPAÇO MUSICAL</p>
      <nav aria-label="Navegação principal" className="mt-5 flex gap-2 md:mt-0 md:flex-col">{navigation.map(item => <button key={item.id} id={`nav-${item.id}`} type="button" aria-pressed={view === item.id} disabled={data.busy} onClick={() => setView(item.id)} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs transition-colors md:justify-start ${view === item.id ? 'bg-acid font-semibold text-forest' : 'text-[#b8c4bb] hover:bg-[#25332b]'}`}><Icon name={item.icon} size={19} /><span>{item.label}</span><span className="ml-auto rounded border border-current/25 px-1.5 text-[10px] opacity-80">{item.count}</span></button>)}</nav>
      <div className="mx-3 mt-16 hidden border-t border-[#344138] pt-6 md:block"><Icon name="spark" size={32} className="mb-5 text-acid" /><strong className="text-xl font-medium leading-7 tracking-tight">Menos planilha.<br />Mais música.</strong><p className="mt-4 text-xs leading-6 text-[#8e9f93]">Organize as faixas.<br />Encontre a sequência.<br />Prepare o próximo show.</p></div>
      <p className="mt-auto hidden items-center gap-2 px-2 pt-8 text-[9px] text-[#a5b3a9] md:flex"><span className="size-1.5 rounded-full bg-[#87b96f]" />Seu repertório, no seu ritmo.</p>
    </aside>
    <main className="min-w-0 md:ml-56 lg:ml-60"><header className="flex h-14 items-center justify-between gap-4 border-b border-line bg-[#fafbf8] px-5 text-[11px] text-muted sm:h-18 sm:px-8 lg:px-10"><span>Organizador de repertórios</span><span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[10px]"><span className="size-1.5 rounded-full bg-[#87b96f]" />Seu espaço musical</span></header>
      <div key={view} className="view-enter mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10 lg:px-10"><div className="mb-7 flex flex-wrap items-center justify-between gap-5 sm:mb-8"><div><p className="mb-3 text-[9px] font-bold tracking-[.18em] text-[#74816c]">DO PRIMEIRO AO ÚLTIMO ACORDE</p><h1 className="text-3xl font-semibold tracking-[-1.2px] sm:text-4xl">{view === 'setlists' ? 'Meus repertórios' : 'Biblioteca musical'}</h1><p className="mt-3 text-xs leading-6 text-muted sm:text-sm">{view === 'setlists' ? 'Cada show tem sua sequência. Monte a sua.' : 'Todas as suas faixas. Infinitas possibilidades de repertório.'}</p></div><Button id="primary-action" variant="primary" icon="plus" disabled={disabled} onClick={() => view === 'setlists' ? openSetlist() : openSong()}>{view === 'setlists' ? 'Nova setlist' : 'Nova música'}</Button></div>
        {data.error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"><span className="flex items-center gap-2"><Icon name="alert" size={16} />{data.error}</span><Button disabled={data.busy || data.refreshing} onClick={() => data.reload().catch(() => {})}>Tentar novamente</Button></div>}
        <section aria-label="Resumo da biblioteca" className="mb-8 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white py-5 sm:py-6"><Stat icon="list" label="Repertórios criados" value={!data.hasLoaded ? '—' : String(data.setlists.length).padStart(2, '0')} /><Stat icon="music" label="Músicas na biblioteca" value={!data.hasLoaded ? '—' : String(data.songs.length).padStart(2, '0')} /><Stat icon="clock" label="Duração da biblioteca" title={duration(seconds)} value={!data.hasLoaded ? '—' : libraryDuration(seconds)} /></section>
        {data.loading ? <div role="status" className="rounded-2xl border border-line bg-white p-12 text-center text-muted">Carregando sua biblioteca…</div> : !data.hasLoaded ? <section className="rounded-2xl border border-line bg-white px-6 py-12 text-center"><Icon name="alert" size={28} className="mx-auto mb-4 text-[#8b996e]" /><h2 className="text-lg font-semibold">Sua biblioteca está indisponível</h2><p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-muted">Ainda não foi possível consultar suas músicas e repertórios. Use “Tentar novamente” para carregar os dados.</p></section> : view === 'library'
          ? <Library onRead={song => setRehearsal({ songs: [song], initialId: song.id })} songs={data.songs} disabled={disabled} onNew={() => openSong()} onEdit={openSong} onDelete={item => askDelete('song', item)} />
          : <Setlists onRehearse={initialId => setRehearsal({ songs: data.detail.musicas, name: data.detail.nome, initialId })} songs={data.songs} setlists={data.setlists} selectedId={data.selectedId} detail={data.detail} disabled={disabled} onSelect={data.selectSetlist} onNew={() => openSetlist()} onNewSong={() => openSong()} onEdit={() => openSetlist(data.detail)} onDelete={() => askDelete('setlist', data.detail)} onAdd={songId => change(() => api(`/setlists/${data.selectedId}/musicas`, 'POST', { musica_id: songId }), 'Música adicionada ao repertório.')} onRemove={songId => change(() => api(`/setlists/${data.selectedId}/musicas/${songId}`, 'DELETE'), 'Música removida do repertório. Mantida na biblioteca.')} onMove={move} />}
        <footer className="mt-9 flex justify-between gap-4 border-t border-line pt-5 text-[9px] text-[#929b8d]"><span>Feito para deixar a música em ordem.</span><span>SETLIST / 2026</span></footer>
      </div>
    </main>
    {rehearsal && <Rehearsal {...rehearsal} onClose={() => setRehearsal(null)} onEdit={song => { setRehearsal(null); openSong(song); }} />}
    {editor && <EditorDialog editor={editor} busy={data.busy} onClose={() => { if (!data.busy) setEditor(null); }} onSave={save} />}
    {deletion && <Dialog title={deletion.type === 'song' ? 'Excluir música?' : 'Excluir repertório?'} busy={data.busy} onClose={() => setDeletion(null)}><span className="mb-4 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-700"><Icon name="trash" size={21} /></span><p className="text-sm leading-7 text-muted">{deletion.type === 'song' ? `“${deletion.item.titulo}” será excluída da biblioteca e de todos os repertórios em que aparece.` : `“${deletion.item.nome}” será excluído. As músicas continuarão na biblioteca.`} Esta ação não pode ser desfeita.</p>{deleteError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-800">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2 border-t border-line pt-5"><Button autoFocus onClick={() => setDeletion(null)} disabled={data.busy}>Cancelar</Button><Button variant="danger" onClick={confirmDelete} disabled={data.busy}>{data.busy ? 'Excluindo…' : 'Excluir'}</Button></div></Dialog>}
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100%_-_2rem)] -translate-x-1/2">{toast && <div className="toast-enter flex items-center gap-2 rounded-xl border border-[#486843] bg-[#243c2b] px-5 py-3 text-xs text-white shadow-xl"><Icon name="check" size={16} />{toast}</div>}</div>
  </div>;
}
