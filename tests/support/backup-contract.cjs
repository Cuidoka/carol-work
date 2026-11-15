'use strict';
const assert = require('node:assert/strict');
const fixture = () => ({ formato: 'setlist-backup', versao: 1, exportado_em: '2026-11-15T12:00:00Z', musicas: [
  { id: 10, titulo: "Canção ' autoral <teste>", artista: 'Banda de teste', duracao_segundos: 250, letra: 'Texto autoral\nLinha dois', cifra: '  C      G\nTexto autoral', tom: 'Am', notas: 'Entrada suave\nFinal em conjunto', letra_fonte: 'https://lrclib.net/api/get/1', cifra_fonte: 'https://www.cifraclub.com.br/banda/faixa/', duracao_fonte: 'https://music.apple.com/br/song/12' },
  { id: 77, titulo: 'Faixa apenas com link', artista: 'Banda de teste', duracao_segundos: 195, cifra_fonte: 'https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/' }
], setlists: [{ id: 20, nome: 'Show autoral', evento: 'Sala de aula', musica_ids: [77, 10] }, { id: 21, nome: 'Outro show', evento: '', musica_ids: [10] }, { id: 22, nome: 'Vazio', evento: '', musica_ids: [] }] });
const contents = data => ({ musicas: data.musicas, setlists: data.setlists });
async function contract(call) {
  const existing = await call('/musicas', 'POST', { titulo: 'Destino preservado', artista: 'Existente', duracao_segundos: 60 }, 201);
  const existingList = await call('/setlists', 'POST', { nome: 'Repertório anterior' }, 201);
  await call(`/setlists/${existingList.id}/musicas`, 'POST', { musica_id: existing.id }, 201);
  const before = contents(await call('/backup'));
  const data = fixture();
  assert.deepEqual(await call('/backup/validar', 'POST', data), { musicas: 2, setlists: 3, vinculos: 3 });
  assert.deepEqual(contents(await call('/backup')), before, 'Prévia não pode gravar');
  const result = await call('/backup', 'POST', data, 201);
  assert.equal(result.musicas, 2); assert.equal(result.setlists, 3); assert.equal(result.vinculos, 3);
  const show = await call(`/setlists/${result.setlist_ids[0]}`);
  assert.deepEqual(show.musicas.map(row => row.id), [result.musica_ids[1], result.musica_ids[0]]);
  assert.equal(show.duracao_total_segundos, 445);
  assert.equal(show.musicas[0].cifra, ''); assert.equal(show.musicas[0].cifra_fonte, data.musicas[1].cifra_fonte);
  for (const key of ['titulo', 'artista', 'duracao_segundos', 'letra', 'cifra', 'tom', 'notas', 'letra_fonte', 'cifra_fonte', 'duracao_fonte']) assert.equal(show.musicas[1][key], data.musicas[0][key]);
  const other = await call(`/setlists/${result.setlist_ids[1]}`);
  assert.equal(other.musicas[0].id, result.musica_ids[0], 'Música deve continuar compartilhada entre repertórios');
  assert.equal((await call(`/setlists/${result.setlist_ids[2]}`)).quantidade_musicas, 0);
  assert.equal((await call(`/setlists/${existingList.id}`)).musicas[0].id, existing.id);
  const exported = await call('/backup');
  assert.equal(exported.formato, 'setlist-backup'); assert.equal(exported.versao, 1);
  assert.deepEqual(exported.setlists.find(row => row.id === show.id).musica_ids, [result.musica_ids[1], result.musica_ids[0]]);
  assert.equal(exported.musicas.length, 3); assert.equal(exported.setlists.length, 4);
  assert.equal(exported.musicas.find(row => row.id === existing.id).titulo, 'Destino preservado');
  const stable = contents(exported);
  const invalid = [null, {}, { ...fixture(), versao: 2 }, { ...fixture(), musicas: {} }];
  for (const mutate of [d => d.musicas.push(d.musicas[0]), d => d.musicas[0].duracao_segundos = 0,
    d => d.musicas[0].letra = null, d => d.musicas[0].cifra_fonte = 'javascript:alert(1)',
    d => d.setlists[0].musica_ids.push(999), d => d.setlists[0].musica_ids = [10, 10], d => d.setlists[0].nome = ' ']) {
    const copy = fixture(); mutate(copy); invalid.push(copy);
  }
  for (const bad of invalid) {
    await call('/backup/validar', 'POST', bad, 400);
    await call('/backup', 'POST', bad, 400);
  }
  assert.deepEqual(contents(await call('/backup')), stable, 'Arquivo inválido não pode alterar nada');
  return exported;
}
module.exports = { fixture, contract, contents };
