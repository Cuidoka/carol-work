import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import { api } from '../lib/api.mjs';

export default function BackupDialog({ busy, onClose, onRestore }) {
  const [working, setWorking] = useState(false), [error, setError] = useState('');
  const [selected, setSelected] = useState(null), [downloaded, setDownloaded] = useState(false);
  const sequence = useRef(0), file = useRef(null);
  useEffect(() => () => { sequence.current++; }, []);
  const locked = busy || working;
  async function download() {
    setWorking(true); setError(''); setDownloaded(false);
    try {
      const data = await api('/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `setlist-backup-${data.exportado_em.replace(/[:.]/g, '-')}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000); setDownloaded(true);
    } catch (error) { setError(error.message); }
    finally { setWorking(false); }
  }
  async function load(event) {
    const chosen = event.target.files?.[0]; event.target.value = '';
    if (!chosen) return;
    const request = ++sequence.current;
    setWorking(true); setError(''); setSelected(null);
    try {
      if (chosen.size > 4 * 1024 * 1024 || !/\.json$/i.test(chosen.name)) throw new Error('Escolha um backup JSON do SETLIST de até 4 MB.');
      let data;
      try { data = JSON.parse(await chosen.text()); } catch { throw new Error('O arquivo não contém JSON válido.'); }
      const summary = await api('/backup/validar', 'POST', data);
      if (request === sequence.current) setSelected({ data, summary, name: chosen.name });
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setWorking(false); }
  }
  async function restore() {
    if (!selected || locked) return;
    setError(''); setWorking(true);
    try { await onRestore(selected.data); }
    catch (error) { setError(error.message); }
    finally { setWorking(false); }
  }
  return <Dialog title="Backup e restauração" eyebrow="SEUS DADOS" busy={locked} onClose={onClose}>
    <section><h3 className="text-sm font-semibold">Guardar uma cópia</h3><p className="my-3 text-xs leading-6 text-muted">Baixe músicas, repertórios, ordem, letras, cifras, notas e links em um arquivo. Guarde-o em um lugar seguro.</p><Button icon="down" disabled={locked} onClick={download}>Baixar backup JSON</Button>{downloaded && <p role="status" className="mt-2 text-xs text-[#4c652b]">Download iniciado. Confira o arquivo na pasta de downloads.</p>}</section>
    <section className="mt-6 border-t border-line pt-5"><h3 className="text-sm font-semibold">Restaurar uma cópia</h3><p className="my-3 text-xs leading-6 text-muted">Os registros do arquivo serão adicionados como novos. Seus dados atuais serão mantidos. Importar o mesmo arquivo novamente cria cópias.</p><Button disabled={locked} onClick={() => file.current?.click()}>Selecionar backup JSON</Button><input hidden ref={file} aria-label="Arquivo de backup" type="file" accept=".json,application/json" onChange={load} />
      {working && !busy && <p role="status" className="mt-3 text-xs text-muted">Processando arquivo…</p>}
      {selected && <div className="mt-4 rounded-xl border border-line bg-canvas p-4"><p className="break-words text-xs font-semibold">{selected.name}</p><p className="my-3 text-xs leading-6 text-muted">{selected.summary.musicas} músicas · {selected.summary.setlists} repertórios · {selected.summary.vinculos} vínculos</p><p className="mb-3 text-xs leading-5">Confira as quantidades antes de confirmar. A restauração preserva a ordem e não substitui registros existentes.</p><Button variant="primary" disabled={locked || !selected.summary.musicas && !selected.summary.setlists} onClick={restore}>Confirmar restauração</Button></div>}
    </section>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-800">{error}</p>}
    <div className="mt-6 flex justify-end border-t border-line pt-4"><Button disabled={locked} onClick={onClose}>Fechar backup</Button></div>
  </Dialog>;
}
