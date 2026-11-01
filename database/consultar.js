'use strict';

// Demonstra as consultas sem instalar um visualizador SQLite. Não escreve no banco.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const file = process.env.SETLIST_DB_PATH || path.join(__dirname, '..', 'dados', 'setlist.sqlite');
if (!fs.existsSync(file)) {
  console.error('Banco não encontrado. Execute node server.js primeiro.');
  process.exitCode = 1;
} else {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const titles = ['JOIN — músicas por repertório', 'COUNT/SUM — quantidade e duração por repertório', 'COUNT — biblioteca'];
    const statements = fs.readFileSync(path.join(__dirname, 'consultas.sql'), 'utf8').split(';').filter(sql => sql.trim());
    statements.forEach((sql, index) => {
      console.log(`\n${titles[index]}`);
      console.table(db.prepare(sql).all());
    });
  } finally { db.close(); }
}
