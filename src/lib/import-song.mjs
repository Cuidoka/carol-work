import { sourceURL } from '../../lib/music-sources.mjs';

export function normalizeChart(text) {
  if (typeof text !== 'string') throw new Error('O arquivo não contém texto.');
  const value = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').replace(/^\n+|\n+$/g, '');
  if (!value.trim()) throw new Error('Cole a cifra pronta ou escolha um arquivo com conteúdo.');
  if (value.includes('\0') || value.length > 20000) throw new Error('A cifra deve ter até 20.000 caracteres e ser um arquivo de texto.');
  return value;
}

// Template desconectado: HTML importado nunca é inserido na página nem executado.
export function importChart(text, html = false, doc = document) {
  if (!html) return { cifra: normalizeChart(text), fonte: '', titulo: '', artista: '', tom: '' };
  if (text.length > 2000000) throw new Error('O HTML deve ter até 2 MB.');
  const template = doc.createElement('template');
  template.innerHTML = text;
  const root = template.content;
  root.querySelectorAll('script,style,iframe,object,embed,ins,svg,noscript,button').forEach(el => el.remove());
  const pre = root.querySelector('pre');
  if (!pre) throw new Error('Não encontrei a cifra neste HTML. Copie somente a cifra no site e cole como texto.');
  pre.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') || root.querySelector('meta[property="og:url"]')?.getAttribute('content');
  const title = root.querySelector('title')?.textContent || '';
  const parts = title.replace(/\s*[-|–]\s*(Cifra Club|Letras\.mus\.br|Letras|Cifras\.com\.br)\s*$/i, '').split(/\s+-\s+/);
  const titleText = root.querySelector('h1')?.textContent?.trim() || parts[0]?.trim() || '';
  return { cifra: normalizeChart(pre.textContent), fonte: sourceURL(canonical),
    titulo: titleText.slice(0, 120), artista: (parts[1] || '').trim().slice(0, 120), tom: '' };
}
