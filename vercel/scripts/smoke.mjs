import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Cria/exclui somente os IDs que este teste cadastrar. Nunca limpa tabelas.
export async function runSmoke(baseUrl) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Informe uma URL HTTP/HTTPS sem credenciais.');
  const origin = base.origin;
  const songs = new Set(), setlists = new Set();
  const request = async (route, method = 'GET', data, status = 200) => {
    const response = await fetch(origin + '/api' + route, { method, signal: AbortSignal.timeout(20000),
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data) });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('A URL não respondeu como API JSON. Confira o deploy e a proteção de acesso da Vercel.');
    const result = await response.json();
    assert.equal(response.status, status, `HTTP inesperado em ${method} ${route}`);
    return result;
  };
  try {
    const suffix = crypto.randomUUID();
    const material = { letra: 'Texto autoral de validação\nSegunda linha', cifra: 'Am      F\nTexto autoral', tom: 'Am', notas: 'Repetir o final', letra_fonte: '', cifra_fonte: 'https://www.cifraclub.com.br/banda/faixa/', duracao_fonte: 'https://music.apple.com/br/song/12' };
    for (const seconds of [200, 195]) {
      const item = await request('/musicas', 'POST', { titulo: `Teste de deploy ${suffix}`, artista: 'Teste descartável', duracao_segundos: seconds, ...material }, 201);
      songs.add(item.id);
      for (const [key, value] of Object.entries(material)) assert.equal(item[key], value, `Material não persistiu no cadastro: ${key}`);
    }
    const [a, b] = [...songs];
    await request(`/musicas/${a}`, 'PUT', { titulo: `Teste editado ${suffix}`, artista: 'Teste descartável', duracao_segundos: 250 });
    const show = await request('/setlists', 'POST', { nome: `Teste de deploy ${suffix}` }, 201);
    setlists.add(show.id);
    await request(`/setlists/${show.id}`, 'PUT', { nome: `Teste editado ${suffix}`, evento: 'Validação online' });
    for (const musica_id of songs) await request(`/setlists/${show.id}/musicas`, 'POST', { musica_id }, 201);
    await request(`/setlists/${show.id}/musicas`, 'POST', { musica_id: a }, 409);
    await request(`/setlists/${show.id}/ordem`, 'PUT', { musica_ids: [b, a] });
    const saved = await request(`/setlists/${show.id}`);
    assert.deepEqual(saved.musicas.map(item => item.id), [b, a]);
    assert.equal(saved.duracao_total_segundos, 445);
    assert.equal(saved.evento, 'Validação online');
    for (const item of saved.musicas) for (const [key, value] of Object.entries(material)) assert.equal(item[key], value, `Material não persistiu no JOIN/edição: ${key}`);
    const summary = (await request('/setlists')).find(item => item.id === show.id);
    assert.equal(summary.quantidade_musicas, 2);
    assert.equal(summary.duracao_total_segundos, 445);
    await request(`/setlists/${show.id}/musicas/${a}`, 'DELETE');
    assert.ok((await request('/musicas')).some(item => item.id === a));
    await request(`/setlists/${show.id}/musicas`, 'POST', { musica_id: a }, 201);
    await request(`/musicas/${a}`, 'DELETE'); songs.delete(a);
    assert.equal((await request(`/setlists/${show.id}`)).quantidade_musicas, 1);
    await request(`/setlists/${show.id}`, 'DELETE'); setlists.delete(show.id);
    assert.ok((await request('/musicas')).some(item => item.id === b));
    await request(`/setlists/${show.id}`, 'GET', undefined, 404);
    await request(`/musicas/${b}`, 'DELETE'); songs.delete(b);
    return 'PASSOU: CRUD, letra/cifra/tom/notas, duplicidade, ordem, JOIN, COUNT/SUM, vínculos, cascatas e leitura entre requisições. Dados do teste removidos.';
  } finally {
    for (const itemId of setlists) await request(`/setlists/${itemId}`, 'DELETE').catch(() => console.error(`Não foi possível limpar a setlist de teste ID ${itemId}.`));
    for (const itemId of songs) await request(`/musicas/${itemId}`, 'DELETE').catch(() => console.error(`Não foi possível limpar a música de teste ID ${itemId}.`));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Uso: node scripts/smoke.mjs https://SEU-PROJETO.vercel.app'); process.exitCode = 1; }
  else {
    try { console.log(await runSmoke(process.argv[2])); }
    catch (error) { console.error(`Teste não passou: ${error.message}`); process.exitCode = 1; }
  }
}
