# SETLIST — Comece aqui

**Apresentação:** 16/11/2026. **Prioridade:** atender ao enunciado acadêmico registrado no documento 01.

## Estado atual — 07/11/2026

O usuário autorizou a reformulação do front-end para **React + Tailwind + Vite**. Há uma única interface em `src/`, compilada para `dist/` e usada por dois back-ends:

- Local: `server.js`, HTTP Node.js nativo e SQLite.
- Online: `api/index.mjs` → workspace `vercel/`, funções Node.js e Neon/PostgreSQL.

Os schemas e os dados dos bancos continuam separados. O modelo N:N, o CRUD e os requisitos acadêmicos foram preservados. A publicação Vercel ainda exige validação online; testes PGlite não equivalem a testar o Neon real.

O código anterior foi arquivado em `backups/pre-react-2026-11-07.zip`, sem dados reais ou credenciais. O histórico registra a primeira implementação, as auditorias, a troca de Turso para Neon e a migração React; registros antigos descrevem os estados daquela data, não a estrutura atual.

## Leitura e autoridade

Leia `AGENTS.md`, este guia e os documentos:

1. `01_PRODUTO_E_ESCOPO.md`: enunciado, funcionalidades e limites.
2. `02_ARQUITETURA_BANCO_E_API.md`: arquitetura atual, tabelas e contrato das rotas.
3. `03_ROTEIRO_IMPLEMENTACAO_E_TESTES.md`: matriz de aceitação e apresentação.
4. `04_HISTORICO_E_DECISOES.md`: decisões e evidências reais.
5. `05_GUIA_PARA_APRESENTAR_E_RESPONDER.md`: explicações para estudar e ensaiar.

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
