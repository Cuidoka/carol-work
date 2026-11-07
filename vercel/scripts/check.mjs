import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

for (const file of ['api/index.mjs', 'lib/database.mjs', 'lib/handler.mjs', 'dev.mjs', 'scripts/init-db.mjs', 'scripts/smoke.mjs']) {
  execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`../${file}`, import.meta.url))]);
}
for (const file of ['database/schema.sql', 'database/consultas.sql']) {
  await access(new URL(`../${file}`, import.meta.url));
}
await access(new URL('../../dist/index.html', import.meta.url));
const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
if (config.framework !== 'vite' || config.outputDirectory !== 'dist' || config.rewrites[0].destination !== '/api/index') throw new Error('Configuração Vercel inválida.');
console.log('Build React, sintaxe da API e configuração básica verificados. Deploy e Neon remoto exigem validação online.');
