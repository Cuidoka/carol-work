import { useEffect, useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import { duration, parseDuration } from '../lib/format.mjs';
import LyricsSearch from './LyricsSearch.jsx';
import CatalogSearch from './CatalogSearch.jsx';
import ChartImport from './ChartImport.jsx';
import { sourceName, sourceURL } from '../../lib/music-sources.mjs';

export default function EditorDialog({ editor, busy, onClose, onSave }) {
  const song = editor.type === 'song';
  const item = editor.item;
  const [initial] = useState(() => song
    ? { titulo: item?.titulo || '', artista: item?.artista || '', duracao: item ? duration(item.duracao_segundos) : '', letra: item?.letra || '', cifra: item?.cifra || '', tom: item?.tom || '', notas: item?.notas || '', letra_fonte: item?.letra_fonte || '', cifra_fonte: item?.cifra_fonte || '', duracao_fonte: item?.duracao_fonte || '' }
    : { nome: item?.nome || '', evento: item?.evento || '' });
  const [values, setValues] = useState(initial);
  const [importDraft, setImportDraft] = useState(false), [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || importDraft;
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function requestClose() { if (!busy) { if (dirty) setConfirmDiscard(true); else onClose(); } }
  const [error, setError] = useState('');
  const [tab, setTab] = useState('details');
  const [notice, setNotice] = useState('');
  const field = (name, label, placeholder, props = {}) => <label className="field-label">{label}<input data-autofocus={name === (song ? 'titulo' : 'nome') ? 'true' : undefined} className="field mt-2 font-normal" name={name} value={values[name]} placeholder={placeholder} maxLength={120} required disabled={busy} onChange={event => setValues(current => ({ ...current, [name]: event.target.value, ...(name === 'duracao' ? { duracao_fonte: '' } : {}) }))} {...props} /></label>;
  async function submit(event) {
    event.preventDefault(); setError('');
    try {
      if (song && (!values.titulo.trim() || !values.artista.trim())) { setTab('details'); throw new Error('Informe o título e o artista da música.'); }
      if (song) { try { parseDuration(values.duracao); } catch (error) { setTab('details'); throw error; } }
      const chartLink = song ? sourceURL(values.cifra_fonte.trim()) : '';
      if (song && values.cifra_fonte.trim() && !chartLink) { setTab('material'); throw new Error('Informe um link HTTPS válido de Cifra Club, Letras, Cifras.com.br, E-Chords ou Ultimate Guitar.'); }
      if (!song && !values.nome.trim()) throw new Error('Informe o nome do repertório.');
      const data = song ? { titulo: values.titulo.trim(), artista: values.artista.trim(), duracao_segundos: parseDuration(values.duracao), letra: values.letra, cifra: values.cifra, tom: values.tom.trim(), notas: values.notas, letra_fonte: values.letra_fonte, cifra_fonte: chartLink, duracao_fonte: values.duracao_fonte }
        : { nome: values.nome.trim(), evento: values.evento.trim() };
      await onSave(data);
    } catch (error) { setError(error.message); }
  }
  const area = (name, label, placeholder, limit, mono = false) => <label className="field-label">{label}<textarea name={name} value={values[name]} maxLength={limit} rows={name === 'notas' ? 3 : 8} disabled={busy} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} placeholder={placeholder} className={`field mt-2 resize-y font-normal leading-7 ${mono ? 'font-mono' : ''}`} spellCheck={!mono} /><span className="mt-1 block text-right text-[10px] font-normal text-muted">{values[name].length.toLocaleString('pt-BR')} / {limit.toLocaleString('pt-BR')}</span></label>;
  return <><Dialog closeLabel="Fechar formulário" drawer={song} title={song ? item ? 'Editar música' : 'Nova música' : item ? 'Editar repertório' : 'Novo repertório'} eyebrow={song ? 'Biblioteca' : 'Repertórios'} busy={busy} onClose={requestClose}>
    {song && <div className="line-tabs editor-tabs" aria-label="Seções da música">{[['details', 'Informações'], ['material', 'Material de ensaio']].map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>}
    <form className="editor-form" onSubmit={submit} noValidate><div className="editor-body space-y-5">{song ? <>
      <div hidden={tab !== 'details'} className="space-y-5">
      {field('titulo', 'Título da música', 'Ex.: Entre Estrelas')}
      {field('artista', 'Artista ou banda', 'Ex.: Banda Aurora')}
      <div className="editor-pair">{field('duracao', 'Duração', '03:45', { inputMode: 'numeric', maxLength: 7, pattern: '[0-9]{1,3}:[0-5][0-9]', 'aria-describedby': 'duration-help' })}{field('tom', <>Tom <span className="font-normal text-muted">· opcional</span></>, 'C, Am, F#', { required: false, maxLength: 12 })}</div>
      <p id="duration-help" className="text-[11px] leading-5 text-muted">Minutos:segundos, de 00:01 a 600:00.</p>{values.duracao_fonte && <a className="inline-block text-[11px] text-muted underline" href={values.duracao_fonte} target="_blank" rel="noreferrer">Duração: {sourceName(values.duracao_fonte)}</a>}
      <details className="tool-disclosure"><summary>Buscar duração no catálogo</summary><CatalogSearch title={values.titulo} artist={values.artista} disabled={busy} onUse={record => { setValues(current => ({ ...current, duracao: duration(record.duracao_segundos), duracao_fonte: record.fonte })); setNotice(`Duração preenchida: ${duration(record.duracao_segundos)} · ${record.titulo} · ${record.artista}. Confira a versão antes de salvar.`); }} /></details>
      {area('notas', 'Notas de ensaio (opcional)', 'Ex.: Entrada só com voz. Repetir o refrão no final.', 2000)}
      </div>
      <div hidden={tab !== 'material'} className="space-y-5">
        <ChartImport title={values.titulo} artist={values.artista} hasChart={!!values.cifra} source={values.cifra_fonte} onSourceChange={value => setValues(current => ({ ...current, cifra_fonte: value }))} onDraftChange={setImportDraft} disabled={busy} onUse={record => { setValues(current => ({ ...current, cifra: record.cifra, cifra_fonte: record.fonte, titulo: current.titulo || record.titulo, artista: current.artista || record.artista })); setNotice('Cifra pronta importada para o formulário. Revise e salve a música para gravar.'); }} />
        <details className="tool-disclosure"><summary>Buscar letra no catálogo</summary><LyricsSearch title={values.titulo} artist={values.artista} hasLyrics={!!values.letra} disabled={busy} onUse={record => { setValues(current => ({ ...current, letra: record.letra, letra_fonte: record.fonte, ...(!current.duracao && Number.isInteger(record.duracao_segundos) && record.duracao_segundos > 0 && record.duracao_segundos <= 36000 ? { duracao: duration(record.duracao_segundos), duracao_fonte: record.fonte } : {}) })); setNotice('Letra importada. Se a duração estava vazia, ela também foi preenchida com a versão do LRCLIB.'); }} /></details>
        {area('letra', 'Letra (opcional)', 'Cole a letra ou use a busca acima…', 20000)}
        {values.letra_fonte && <p className="text-[11px] text-muted">Origem: <a href={values.letra_fonte} target="_blank" rel="noreferrer" className="underline underline-offset-4">LRCLIB</a>. Você pode revisar o texto antes de salvar.</p>}
        {area('cifra', 'Cifra (opcional)', 'Importe a cifra pronta acima ou edite seu material autoral…', 20000, true)}
        {values.cifra_fonte && <p className="text-[11px] text-muted">Origem da cifra: <a className="underline" href={values.cifra_fonte} target="_blank" rel="noreferrer">{sourceName(values.cifra_fonte)}</a></p>}
        <p className="text-[11px] leading-6 text-muted">Os espaços e as quebras de linha são preservados no ensaio. Você pode ajustar a cifra importada ou escrever uma composição autoral.</p>
      </div>
    </> : <>{field('nome', 'Nome do repertório', 'Ex.: Show de estreia')}{field('evento', <>Evento ou local <span className="font-normal text-muted">(opcional)</span></>, 'Ex.: Festival do Campus', { required: false })}</>}</div>
      {notice && <p role="status" className="mb-4 text-xs leading-6 text-accent">{notice}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions"><Button onClick={requestClose} disabled={busy}>Cancelar</Button><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Salvando…' : song ? 'Salvar música' : 'Salvar repertório'}</Button></div>
    </form>
  </Dialog>{confirmDiscard && <Dialog title="Descartar alterações?" closeLabel="Continuar editando" onClose={() => setConfirmDiscard(false)}><p className="text-sm leading-7 text-muted">Há alterações não salvas. Se sair agora, elas serão perdidas.</p><div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5"><Button autoFocus onClick={() => setConfirmDiscard(false)}>Continuar editando</Button><Button variant="danger" onClick={onClose}>Descartar alterações</Button></div></Dialog>}</>;
}
