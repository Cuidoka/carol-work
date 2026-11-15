# SETLIST — Comece aqui

**Prazo vigente:** fim de novembro de 2026 (atualização do usuário; data anterior: 16/11). **Prioridade:** atender ao enunciado acadêmico registrado no documento 01.

## Estado atual — 14/11/2026

**Extensão de catálogos/importação publicada e validada:** duração por Apple/iTunes ou MusicBrainz, duração LRCLIB quando vazia, e cifras prontas por colagem/TXT/HTML com revisão. Não há download automático por link Cifra Club/Letras; a pesquisa encontrou bloqueio 403 no servidor. Build, 34 testes locais/PGlite, smoke Neon real/público e navegador na Vercel passaram. Consulte `07_CATALOGOS_E_IMPORTACAO.md` e a última entrada do histórico para evidências e limites. Dados preexistentes preservados.

**Ferramentas Neon:** CLI 9.5.0 autenticado por GitHub, plugin oficial neon-postgres 3.0.8 com sete skills instalado no Codex. As skills carregaram após reinício; operações de banco executadas pelo CLI. Configurações anteriores preservadas. Vercel CLI 65.16.0 autenticado e vinculado ao projeto existente carol-work. Credenciais ficam somente em arquivos ignorados e no ambiente servidor.

**Online publicado e validado:** https://carol-work.vercel.app/ — projeto Neon separado SETLIST (`cold-frost-08199078`), branch main. Schema, CRUD/material musical, JOIN/agregações, ordem e cascatas passaram no Neon real e pela URL pública. Navegador confirmou persistência, busca, ensaio e layout em celular/desktop. Dados de teste removidos; aplicação pronta para receber a biblioteca do usuário. Consulte o histórico para comandos, limites e capturas.

Acabamento visual e recursos de ensaio autorizados: letras/cifras, tom/notas por música, busca LRCLIB com revisão, leitura na ordem do repertório. Consulte `06_EVOLUCAO_E_QUALIDADE.md` para critérios e pendências. Migração local automática e aditiva; no Neon reaplicar o schema antes de publicar o código novo.

O usuário autorizou a reformulação do front-end para **React + Tailwind + Vite**. Há uma única interface em `src/`, compilada para `dist/` e usada por dois back-ends:

- Local: `server.js`, HTTP Node.js nativo e SQLite.
- Online: `api/index.mjs` → workspace `vercel/`, funções Node.js e Neon/PostgreSQL.

Os schemas e os dados dos bancos continuam separados. O modelo N:N, o CRUD e os requisitos acadêmicos foram preservados. A versão Vercel passou por validação online com Neon real, além dos testes PGlite; as duas evidências estão separadas no histórico.

O código anterior foi arquivado em `backups/pre-react-2026-11-07.zip`, sem dados reais ou credenciais. O histórico registra a primeira implementação, as auditorias, a troca de Turso para Neon e a migração React; registros antigos descrevem os estados daquela data, não a estrutura atual.

## Leitura e autoridade

Leia `AGENTS.md`, este guia e os documentos:

1. `01_PRODUTO_E_ESCOPO.md`: enunciado, funcionalidades e limites.
2. `02_ARQUITETURA_BANCO_E_API.md`: arquitetura atual, tabelas e contrato das rotas.
3. `03_ROTEIRO_IMPLEMENTACAO_E_TESTES.md`: matriz de aceitação e apresentação.
4. `04_HISTORICO_E_DECISOES.md`: decisões e evidências reais.
5. `05_GUIA_PARA_APRESENTAR_E_RESPONDER.md`: explicações para estudar e ensaiar.
6. `06_EVOLUCAO_E_QUALIDADE.md`: meta de evolução, critérios, migração e dependência externa.

Enunciado e decisões explícitas do usuário prevalecem sobre documentação antiga. Consulte o código antes de mudar comportamento. Não presumir que uma auditoria anterior prova o estado atual após novas mudanças.

## Executar

Node.js **24.x** e npm, a partir da raiz:

```powershell
npm ci
npm start
```

`npm start` compila React/Tailwind e inicia a aplicação em `http://localhost:3000`. Para desenvolvimento: `npm run dev` e `http://127.0.0.1:5173`.

Para testar tudo: `npm run test:all`. Para mostrar SQL: `npm run consultas`. Os testes usam bancos temporários. Não apagar `dados/setlist.sqlite`.

## Pontos críticos da migração

- A interface antiga de `public/app.js`/`styles.css` foi substituída por componentes React e Tailwind. `public/` contém apenas o favicon.
- A raiz usa npm workspaces; há um único lockfile na raiz. Instalar dependências somente por ele.
- O servidor entrega `dist/`, não os arquivos JSX. `node server.js` requer compilação prévia; `npm start` a faz automaticamente.
- Na Vercel, **Root Directory é a raiz do repositório**, com Framework Vite e saída `dist`. A seleção antiga `vercel/` não é mais correta.
- A conexão Neon fica somente no servidor, em `DATABASE_URL`. Front-end nunca recebe a senha.
- A quantidade e duração vêm da integração real; não substituir por dados só em memória ou simulações.

## Definição de pronto

Inicializa localmente, CRUD e vínculos pela interface persistem, PK/FK estão corretas, JOIN e agregação são demonstráveis e o aluno consegue explicar e executar os fluxos. A versão online só pode ser declarada validada depois de testada na URL real com Neon remoto.
