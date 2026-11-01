import { readFile } from 'node:fs/promises';
import { getDatabase } from '../lib/database.mjs';

let client;
try {
  client = await getDatabase().connect();
  // Não apaga tabelas nem importa o banco local. Use um banco Neon dedicado.
  const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  await client.query(sql);
  const fk = await client.query(`SELECT conname FROM pg_constraint
    WHERE conrelid = 'setlist_musicas'::regclass AND contype = 'f' AND confdeltype = 'c'`);
  if (fk.rows.length !== 2) throw new Error('O esquema remoto não contém as duas FKs esperadas.');
  console.log('Esquema PostgreSQL inicializado e FKs verificadas. Nenhum dado local foi importado.');
} catch {
  console.error('Inicialização falhou. Confira DATABASE_URL e o esquema do banco Neon.');
  process.exitCode = 1;
} finally { if (client) await client.release(); }
