import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createHandler } from '../lib/handler.mjs';
import checks from '../../tests/support/backup-contract.cjs';

test('Backup PostgreSQL: validação, material, N:N, ordem, preservação e rollback', async () => {
  const engine = await PGlite.create();
  try {
    await engine.exec(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    const client = { async connect() { return { query: async (sql, params) => { const result = await engine.query(sql, params); return { ...result, rowCount: result.affectedRows ?? result.rows.length }; }, release: async () => {} }; } };
    const handler = createHandler(client);
    const call = async (route, method = 'GET', body, status = 200) => {
      const response = await handler(new Request('http://localhost/api' + route, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }));
      const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
    };
    await checks.contract(call);
    const before = checks.contents(await call('/backup'));
    let inserts = 0, released = 0;
    const broken = createHandler({ async connect() { return { query: async (sql, params) => {
      if (sql.startsWith('INSERT INTO setlist_musicas') && ++inserts === 2) return engine.query('SELECT coluna_inexistente');
      return engine.query(sql, params);
    }, release: async () => { released++; } }; } });
    const result = await broken(new Request('http://localhost/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checks.fixture()) }));
    assert.equal(result.status, 503); assert.equal(released, 1);
    assert.deepEqual(checks.contents(await call('/backup')), before);
    const noDb = createHandler({ connect() { throw new Error('Prévia não pode abrir conexão'); } });
    const preview = await noDb(new Request('http://localhost/api/backup/validar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checks.fixture()) }));
    assert.equal(preview.status, 200);
  } finally { await engine.close(); }
});
