import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, duration } from '../src/lib/format.mjs';

test('Formulário React converte durações nos limites aceitos pela API', () => {
  assert.equal(parseDuration('00:01'), 1);
  assert.equal(parseDuration('03:20'), 200);
  assert.equal(parseDuration('04:10'), 250);
  assert.equal(parseDuration('600:00'), 36000);
});
test('Formulário React rejeita duração zero, segundos inválidos e valores fora do limite', () => {
  for (const value of ['00:00', '600:01', '03:60', '-1:00', '3.20', '200', '', '03:2']) assert.throws(() => parseDuration(value));
});
test('Total de segundos usado pela API é exibido corretamente na interface', () => {
  assert.equal(duration(250 + 195), '07:25');
  assert.equal(duration(0), '00:00');
  assert.equal(duration(36000), '600:00');
});
