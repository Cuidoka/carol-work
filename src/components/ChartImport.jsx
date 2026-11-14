import { useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { importChart } from '../lib/import-song.mjs';
import { searchLinks, sourceURL } from '../../lib/music-sources.mjs';

export default function ChartImport({ title, artist, hasChart, disabled, onUse }) {
  const [text, setText] = useState(''), [source, setSource] = useState('');
  const [preview, setPreview] = useState(null), [error, setError] = useState(''), [reading, setReading] = useState(false);
  const file = useRef(null), sequence = useRef(0);
  const busy = disabled || reading;
  function review(value = text, html = false) {
    setError(''); setPreview(null);
    try {
      const result = importChart(value, html);
      if (html) setText(result.cifra);
      if (source && !sourceURL(source)) throw new Error('Use um link HTTPS de Cifra Club, Letras, Cifras.com.br, E-Chords ou Ultimate Guitar.');
      setPreview({ ...result, fonte: sourceURL(source) || result.fonte });
    } catch (error) { setError(error.message); }
  }
  async function load(event) {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    const request = ++sequence.current;
    setError(''); setPreview(null); setReading(true);
    try {
      if (selected.size > 2000000 || !/\.(txt|html?)$/i.test(selected.name)) throw new Error('Escolha um arquivo TXT ou HTML de até 2 MB.');
      const content = await selected.text();
      if (request === sequence.current) {
        if (/\.html?$/i.test(selected.name)) review(content, true);
        else { setText(content); review(content); }
      }
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setReading(false); }
  }
  return <div className="rounded-xl border border-[#dce6cd] bg-[#f7faef] p-4">
    <h3 className="text-xs font-semibold">Importar cifra pronta</h3>
    <p className="mt-1 text-[11px] leading-5 text-muted">Abra a fonte, copie a cifra com os acordes e cole abaixo. Você também pode importar um TXT ou uma página salva em HTML. Não precisa escrever a cifra.</p>
    <div className="my-3 flex flex-wrap gap-2">{searchLinks(title, artist).map(link => <a key={link.name} className="rounded-lg border border-line bg-white px-3 py-2 text-[11px] font-semibold underline-offset-4 hover:underline" href={link.url} target="_blank" rel="noreferrer">Buscar no {link.name} ↗</a>)}</div>
    <p className="mb-3 text-[10px] leading-5 text-muted">A busca abre o site da fonte. O link sozinho não baixa a cifra: copie o material desejado ou selecione um arquivo para importar.</p>
    <label className="field-label">Cifra copiada<textarea className="field mt-2 font-mono text-xs" rows={4} value={text} disabled={busy} maxLength={20000} placeholder="Cole aqui a cifra pronta do site…" onChange={event => { sequence.current++; setText(event.target.value); setPreview(null); setError(''); }} onPaste={event => {
      const html = event.clipboardData.getData('text/html');
      if (html && /<pre[\s>]/i.test(html)) { event.preventDefault(); review(html, true); }
    }} /></label>
    <label className="field-label mt-3">Link da fonte (opcional)<input className="field mt-2 font-normal" type="url" maxLength={500} disabled={busy} value={source} placeholder="https://www.cifraclub.com.br/artista/musica/" onChange={event => { setSource(event.target.value); setPreview(null); setError(''); }} /></label>
    <div className="mt-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => review()}>Revisar cifra colada</Button><Button disabled={busy} onClick={() => file.current?.click()}>{reading ? 'Lendo…' : 'Importar arquivo TXT/HTML'}</Button><input ref={file} aria-label="Arquivo da cifra" type="file" accept=".txt,.html,.htm,text/plain,text/html" hidden onChange={load} /></div>
    {error && <p role="alert" className="mt-3 text-xs text-red-800">{error}</p>}
    {preview && <div className="mt-4 border-t border-line pt-3"><h4 className="text-[11px] font-semibold">Prévia da cifra pronta{preview.titulo ? ` · ${preview.titulo}` : ''}</h4><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-white p-3 font-mono text-xs leading-6">{preview.cifra}</pre><p className="my-2 text-[10px] text-muted">{preview.cifra.length.toLocaleString('pt-BR')} caracteres. Só será gravada ao salvar a música.</p><Button disabled={busy} icon="check" onClick={() => { onUse(preview); setPreview(null); setText(''); setSource(''); }}>{hasChart ? 'Substituir pela cifra importada' : 'Usar esta cifra'}</Button></div>}
  </div>;
}
