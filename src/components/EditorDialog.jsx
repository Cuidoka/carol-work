import { useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import { duration, parseDuration } from '../lib/format.mjs';
import LyricsSearch from './LyricsSearch.jsx';
import CatalogSearch from './CatalogSearch.jsx';
import ChartImport from './ChartImport.jsx';
import { sourceName } from '../../lib/music-sources.mjs';

export default function EditorDialog({ editor, busy, onClose, onSave }) {
  const song = editor.type === 'song';
  const item = editor.item;
  const [values, setValues] = useState(song
    ? { titulo: item?.titulo || '', artista: item?.artista || '', duracao: item ? duration(item.duracao_segundos) : '', letra: item?.letra || '', cifra: item?.cifra || '', tom: item?.tom || '', notas: item?.notas || '', letra_fonte: item?.letra_fonte || '', cifra_fonte: item?.cifra_fonte || '', duracao_fonte: item?.duracao_fonte || '' }
    : { nome: item?.nome || '', evento: item?.evento || '' });
  const [error, setError] = useState('');
  const [tab, setTab] = useState('details');
  const [notice, setNotice] = useState('');
  const field = (name, label, placeholder, props = {}) => <label className="field-label">{label}<input data-autofocus={name === (song ? 'titulo' : 'nome') ? 'true' : undefined} className="field mt-2 font-normal" name={name} value={values[name]} placeholder={placeholder} maxLength={120} required disabled={busy} onChange={event => setValues(current => ({ ...current, [name]: event.target.value, ...(name === 'duracao' ? { duracao_fonte: '' } : {}) }))} {...props} /></label>;
  async function submit(event) {
    event.preventDefault(); setError('');
    try {
      if (song && (!values.titulo.trim() || !values.artista.trim())) { setTab('details'); throw new Error('Informe o título e o artista da música.'); }
      if (song) { try { parseDuration(values.duracao); } catch (error) { setTab('details'); throw error; } }
      if (!song && !values.nome.trim()) throw new Error('Informe o nome do repertório.');
      const data = song ? { titulo: values.titulo.trim(), artista: values.artista.trim(), duracao_segundos: parseDuration(values.duracao), letra: values.letra, cifra: values.cifra, tom: values.tom.trim(), notas: values.notas, letra_fonte: values.letra_fonte, cifra_fonte: values.cifra_fonte, duracao_fonte: values.duracao_fonte }
        : { nome: values.nome.trim(), evento: values.evento.trim() };
      await onSave(data);
    } catch (error) { setError(error.message); }
  }
  const area = (name, label, placeholder, limit, mono = false) => <label className="field-label">{label}<textarea name={name} value={values[name]} maxLength={limit} rows={name === 'notas' ? 3 : 8} disabled={busy} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} placeholder={placeholder} className={`field mt-2 resize-y font-normal leading-7 ${mono ? 'font-mono' : ''}`} spellCheck={!mono} /><span className="mt-1 block text-right text-[10px] font-normal text-muted">{values[name].length.toLocaleString('pt-BR')} / {limit.toLocaleString('pt-BR')}</span></label>;
  return <Dialog closeLabel="Fechar formulário" wide={song} title={song ? item ? 'Editar música' : 'Nova música' : item ? 'Editar repertório' : 'Nova setlist'} eyebrow={song ? 'BIBLIOTECA MUSICAL' : 'MEUS REPERTÓRIOS'} busy={busy} onClose={onClose}>
    {song && <div className="mb-6 flex gap-1 rounded-xl bg-canvas p-1" aria-label="Seções da música">{[['details', 'Dados da música'], ['material', 'Letra e cifra']].map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${tab === id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}</button>)}</div>}
    <form onSubmit={submit} noValidate><div className="space-y-5">{song ? <>
      <div hidden={tab !== 'details'} className="space-y-5">
      {field('titulo', 'Título da música', 'Ex.: Entre Estrelas')}
      {field('artista', 'Artista ou banda', 'Ex.: Banda Aurora')}
      <CatalogSearch title={values.titulo} artist={values.artista} disabled={busy} onUse={record => { setValues(current => ({ ...current, duracao: duration(record.duracao_segundos), duracao_fonte: record.fonte })); setNotice(`Duração preenchida: ${duration(record.duracao_segundos)} · ${record.titulo} · ${record.artista}. Confira a versão antes de salvar.`); }} />
      <div>{field('duracao', 'Duração', '03:45', { inputMode: 'numeric', maxLength: 7, pattern: '[0-9]{1,3}:[0-5][0-9]', 'aria-describedby': 'duration-help' })}<p id="duration-help" className="mt-2 text-[11px] text-muted">Use minutos:segundos, de 00:01 a 600:00. Para músicas autorais, informe o tempo manualmente.</p>{values.duracao_fonte && <a className="mt-2 inline-block text-[11px] text-muted underline" href={values.duracao_fonte} target="_blank" rel="noreferrer">Duração: {sourceName(values.duracao_fonte)}</a>}</div>
      {field('tom', <>Tom <span className="font-normal text-muted">(opcional)</span></>, 'Ex.: C, Am, F#', { required: false, maxLength: 12 })}
      {area('notas', 'Notas de ensaio (opcional)', 'Ex.: Entrada só com voz. Repetir o refrão no final.', 2000)}
      </div>
      <div hidden={tab !== 'material'} className="space-y-5">
        <ChartImport title={values.titulo} artist={values.artista} hasChart={!!values.cifra} disabled={busy} onUse={record => { setValues(current => ({ ...current, cifra: record.cifra, cifra_fonte: record.fonte, titulo: current.titulo || record.titulo, artista: current.artista || record.artista })); setNotice('Cifra pronta importada para o formulário. Revise e salve a música para gravar.'); }} />
        <LyricsSearch title={values.titulo} artist={values.artista} hasLyrics={!!values.letra} disabled={busy} onUse={record => { setValues(current => ({ ...current, letra: record.letra, letra_fonte: record.fonte, ...(!current.duracao && Number.isInteger(record.duracao_segundos) && record.duracao_segundos > 0 && record.duracao_segundos <= 36000 ? { duracao: duration(record.duracao_segundos), duracao_fonte: record.fonte } : {}) })); setNotice('Letra importada. Se a duração estava vazia, ela também foi preenchida com a versão do LRCLIB.'); }} />
        {area('letra', 'Letra (opcional)', 'Cole a letra ou use a busca acima…', 20000)}
        {values.letra_fonte && <p className="text-[11px] text-muted">Origem: <a href={values.letra_fonte} target="_blank" rel="noreferrer" className="underline underline-offset-4">LRCLIB</a>. Você pode revisar o texto antes de salvar.</p>}
        {area('cifra', 'Cifra (opcional)', 'Importe a cifra pronta acima ou edite seu material autoral…', 20000, true)}
        {values.cifra_fonte && <p className="text-[11px] text-muted">Origem da cifra: <a className="underline" href={values.cifra_fonte} target="_blank" rel="noreferrer">{sourceName(values.cifra_fonte)}</a></p>}
        <p className="text-[11px] leading-6 text-muted">Os espaços e as quebras de linha são preservados no ensaio. Você pode ajustar a cifra importada ou escrever uma composição autoral.</p>
      </div>
    </> : <>{field('nome', 'Nome do repertório', 'Ex.: Show de estreia')}{field('evento', <>Evento ou local <span className="font-normal text-muted">(opcional)</span></>, 'Ex.: Festival do Campus', { required: false })}</>}</div>
      {notice && <p role="status" className="mt-4 text-xs leading-6 text-[#4c652b]">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      <div className="mt-7 flex justify-end gap-2 border-t border-line pt-5"><Button onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Salvando…' : song ? 'Salvar música' : 'Salvar repertório'}</Button></div>
    </form>
  </Dialog>;
}
