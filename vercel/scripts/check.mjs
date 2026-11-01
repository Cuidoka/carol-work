import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

for (const file of ['api/index.mjs', 'lib/database.mjs', 'lib/handler.mjs', 'dev.mjs', 'public/app.js', 'scripts/init-db.mjs', 'scripts/smoke.mjs']) {
  execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`../${file}`, import.meta.url))]);
}
for (const file of ['public/index.html', 'public/styles.css', 'public/favicon.svg', 'database/schema.sql', 'database/consultas.sql']) {
  await access(new URL(`../${file}`, import.meta.url));
}
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
if (config.outputDirectory !== 'public' || config.rewrites[0].destination !== '/api/index') throw new Error('Configuração Vercel inválida.');
console.log('Sintaxe, arquivos estáticos e configuração local verificados. Deploy e banco remoto exigem validação online.');
