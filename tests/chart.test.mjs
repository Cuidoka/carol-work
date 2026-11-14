import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChart } from '../src/lib/import-song.mjs';
import { sourceURL, sourceName, searchLinks } from '../lib/music-sources.mjs';

test('Cifra importada preserva alinhamento e rejeita conteúdo vazio, binário ou excessivo', () => {
  assert.equal(normalizeChart('\uFEFF  C     G\r\nTexto\u00a0próprio\r\nAm     F\n'), '  C     G\nTexto próprio\nAm     F');
  for (const value of ['', '   ', 'x\0y', 'x'.repeat(20001), null]) assert.throws(() => normalizeChart(value));
});

test('Fontes têm hosts fixos e protocolos seguros, sem credenciais ou servidores arbitrários', () => {
  const valid = 'https://www.cifraclub.com.br/banda/musica/';
  assert.equal(sourceURL(valid), valid); assert.equal(sourceName(valid), 'Cifra Club');
  assert.equal(sourceURL('https://lrclib.net/api/get/12', 'duracao'), 'https://lrclib.net/api/get/12');
  for (const url of ['javascript:alert(1)', 'http://www.cifraclub.com.br/a/b/', 'https://cifraclub.com.br.evil.example/a/',
    'https://user:pass@www.cifraclub.com.br/a/b/', 'https://127.0.0.1/a/', 'https://lrclib.net/api/search', 'https://www.cifraclub.com.br/']) assert.equal(sourceURL(url), '');
  assert.equal(sourceURL(valid, 'duracao'), '');
  assert.ok(searchLinks('Faixa & teste', 'Banda').every(item => new URL(item.url).protocol === 'https:'));
});
