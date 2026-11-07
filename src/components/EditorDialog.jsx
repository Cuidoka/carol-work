import { useState } from 'react';
import Dialog from './Dialog.jsx';
import { Button } from './Button.jsx';
import { duration, parseDuration } from '../lib/format.mjs';

export default function EditorDialog({ editor, busy, onClose, onSave }) {
  const song = editor.type === 'song';
  const item = editor.item;
  const [values, setValues] = useState(song
    ? { titulo: item?.titulo || '', artista: item?.artista || '', duracao: item ? duration(item.duracao_segundos) : '' }
    : { nome: item?.nome || '', evento: item?.evento || '' });
  const [error, setError] = useState('');
  const field = (name, label, placeholder, props = {}) => <label className="field-label">{label}<input autoFocus={name === (song ? 'titulo' : 'nome')} className="field mt-2 font-normal" name={name} value={values[name]} placeholder={placeholder} maxLength={120} required disabled={busy} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} {...props} /></label>;
  async function submit(event) {
    event.preventDefault(); setError('');
    try {
      const data = song ? { titulo: values.titulo.trim(), artista: values.artista.trim(), duracao_segundos: parseDuration(values.duracao) }
        : { nome: values.nome.trim(), evento: values.evento.trim() };
      await onSave(data);
    } catch (error) { setError(error.message); }
  }
  return <Dialog title={song ? item ? 'Editar música' : 'Nova música' : item ? 'Editar repertório' : 'Nova setlist'} eyebrow={song ? 'BIBLIOTECA MUSICAL' : 'MEUS REPERTÓRIOS'} busy={busy} onClose={onClose}>
    <form onSubmit={submit}><div className="space-y-5">{song ? <>
      {field('titulo', 'Título da música', 'Ex.: Entre Estrelas')}
      {field('artista', 'Artista ou banda', 'Ex.: Banda Aurora')}
      <div>{field('duracao', 'Duração', '03:45', { inputMode: 'numeric', maxLength: 7, pattern: '[0-9]{1,3}:[0-5][0-9]', 'aria-describedby': 'duration-help' })}<p id="duration-help" className="mt-2 text-[11px] text-muted">Use minutos:segundos, de 00:01 a 600:00.</p></div>
    </> : <>{field('nome', 'Nome do repertório', 'Ex.: Show de estreia')}{field('evento', <>Evento ou local <span className="font-normal text-muted">(opcional)</span></>, 'Ex.: Festival do Campus', { required: false })}</>}</div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      <div className="mt-7 flex justify-end gap-2 border-t border-line pt-5"><Button onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Salvando…' : song ? 'Salvar música' : 'Salvar repertório'}</Button></div>
    </form>
  </Dialog>;
}
