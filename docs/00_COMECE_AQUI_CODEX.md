# SETLIST — Comece aqui

**Prazo vigente:** fim de novembro de 2026 (atualização do usuário; data anterior: 16/11). **Prioridade:** atender ao enunciado acadêmico registrado no documento 01.

## Estado atual — 14/11/2026

**Ferramentas Neon:** CLI 9.5.0 instalado globalmente e autenticado por GitHub no perfil DEFAULT. Plugin oficial neon-postgres 3.0.8 habilitado no Codex em escopo de usuário, com sete skills e MCP HTTP. Reiniciar o Codex para carregar; primeiro uso do MCP pode exigir consentimento OAuth. Configuração anterior preservada. Esse setup não criou/vinculou banco nem configurou DATABASE_URL/Vercel. Consulte a última entrada do histórico antes de retomar o provisionamento.

**Atualização após a retomada:** criado projeto Neon separado **SETLIST** (`cold-frost-08199078`), branch `main`; schema aplicado após smoke completo em branch temporário real. Conexões locais em `vercel/.env.local` ignorado, com URL pooled para app e direta para migração. Vercel `carol-work` vinculada e autenticada; DATABASE_URL correta adicionada como segredo em Production, corrigindo prefixo duplicado anterior. Publicação/verificação pública em execução; consultar o registro mais recente antes de afirmar que o site online passou.

Acabamento visual e recursos de ensaio autorizados: letras/cifras, tom/notas por música, busca LRCLIB com revisão, leitura na ordem do repertório. Consulte `06_EVOLUCAO_E_QUALIDADE.md` para critérios e pendências. Migração local automática e aditiva; no Neon reaplicar o schema antes de publicar o código novo.

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
