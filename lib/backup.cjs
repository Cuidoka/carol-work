'use strict';
const { materialData, limits } = require('./song-material.cjs');
const MAX_BYTES = 4 * 1024 * 1024;
const fields = Object.keys(limits);
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function identifier(value) { return Number.isSafeInteger(value) && value > 0; }
function text(value, label, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || value.includes('\0') || value.trim().length > 120 || (!optional && !value.trim())) fail(`${label}: informe ${optional ? 'até 120' : 'de 1 a 120'} caracteres.`);
  return value.trim();
}
async function validateBackup(data) {
  if (!object(data) || data.formato !== 'setlist-backup' || data.versao !== 1) fail('Este arquivo não é um backup SETLIST da versão suportada.');
  if (!Array.isArray(data.musicas) || !Array.isArray(data.setlists)) fail('O backup deve conter músicas e repertórios.');
  if (data.musicas.length > 1000 || data.setlists.length > 200) fail('O backup aceita até 1.000 músicas e 200 repertórios.');
  const songs = new Set(), lists = new Set(), musicas = [], setlists = [];
  for (const row of data.musicas) {
    if (!object(row) || !identifier(row.id) || songs.has(row.id)) fail('O backup contém identificador de música inválido ou repetido.');
    songs.add(row.id);
    if (!Number.isInteger(row.duracao_segundos) || row.duracao_segundos < 1 || row.duracao_segundos > 36000) fail('O backup contém uma duração inválida.');
    const material = await materialData(row);
    musicas.push({ id: row.id, titulo: text(row.titulo, 'Título'), artista: text(row.artista, 'Artista'), duracao_segundos: row.duracao_segundos,
      ...Object.fromEntries(fields.map((key, index) => [key, material[index]])) });
  }
  let links = 0;
  for (const row of data.setlists) {
    if (!object(row) || !identifier(row.id) || lists.has(row.id)) fail('O backup contém identificador de repertório inválido ou repetido.');
    lists.add(row.id);
    if (!Array.isArray(row.musica_ids) || new Set(row.musica_ids).size !== row.musica_ids.length || row.musica_ids.some(id => !identifier(id) || !songs.has(id))) fail('Um repertório contém música repetida ou ausente do backup.');
    links += row.musica_ids.length;
    if (links > 10000) fail('O backup aceita até 10.000 vínculos.');
    setlists.push({ id: row.id, nome: text(row.nome, 'Nome'), evento: text(row.evento, 'Evento', true), musica_ids: [...row.musica_ids] });
  }
  return { musicas, setlists, resumo: { musicas: musicas.length, setlists: setlists.length, vinculos: links } };
}
function createBackup(songs, lists, links) {
  const byList = new Map(lists.map(row => [row.id, []]));
  for (const link of links) byList.get(link.setlist_id)?.push(link.musica_id);
  const result = { formato: 'setlist-backup', versao: 1, exportado_em: new Date().toISOString(),
    musicas: songs.map(row => ({ id: row.id, titulo: row.titulo, artista: row.artista, duracao_segundos: row.duracao_segundos,
      ...Object.fromEntries(fields.map(key => [key, row[key] ?? ''])) })),
    setlists: lists.map(row => ({ id: row.id, nome: row.nome, evento: row.evento, musica_ids: byList.get(row.id) })) };
  if (Buffer.byteLength(JSON.stringify(result, null, 2)) > MAX_BYTES) fail('A biblioteca excede o limite de backup de 4 MB.', 413);
  return result;
}
module.exports = { MAX_BYTES, fields, validateBackup, createBackup };
