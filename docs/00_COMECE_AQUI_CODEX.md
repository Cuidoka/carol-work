# SETLIST — Comece aqui (guia para trabalhar com o Codex)

**Projeto:** SETLIST — Organizador de Repertórios Musicais  
**Tipo:** trabalho acadêmico de desenvolvimento de software com banco de dados  
**Data de apresentação:** 16/11/2026  
**Prioridade:** cumprir integralmente os itens do enunciado, sem transformar o protótipo em produto comercial.

## 1. Para que serve esta documentação

Este conjunto de arquivos serve como **fonte de contexto e critérios verificáveis** para um agente de programação. Não é uma ordem para reconstruir o projeto do zero. Antes de alterar qualquer coisa, o agente deve ler e conferir os arquivos reais do repositório.

Documentos de referência:

1. `docs/01_PRODUTO_E_ESCOPO.md` — problema, objetivo, fluxos, funcionalidades, limites e critérios de aceitação.
2. `docs/02_ARQUITETURA_BANCO_E_API.md` — tecnologia atual, modelo relacional, regras de dados, rotas e SQL.
3. `docs/03_ROTEIRO_IMPLEMENTACAO_E_TESTES.md` — fases, tarefas, testes e roteiro de apresentação.
4. `AGENTS.md` — regras permanentes para o Codex quando trabalhar neste repositório.
5. `docs/04_HISTORICO_E_DECISOES.md` — registro de decisões, alterações e pendências verificadas.

**Hierarquia de fontes:** enunciado da professora e decisões explícitas do usuário > documentação de escopo > código/schema reais para descrever o estado atual > suposições do agente. Se a documentação e o código discordarem, identificar e relatar a divergência antes de mudar comportamento.

## 2. Estado verificado em 01/11/2026

**Correção da premissa original:** a pasta recebida continha somente os seis documentos Markdown, sem código nem banco. O usuário confirmou isso e autorizou a implementação integral. As descrições anteriores de código recebido e testes na preparação dos documentos não constituíam evidência desta pasta. A primeira implementação foi criada nesta sessão, seguindo o escopo abaixo.

Agora estão implementados:

- Front-end estático em `public/index.html`, `public/styles.css` e `public/app.js`.
- Back-end HTTP em `server.js`, com módulos nativos do Node.js.
- Banco SQLite: criação em `database/schema.sql` e arquivo local `dados/setlist.sqlite` gerado em tempo de execução.
- Consultas demonstrativas em `database/consultas.sql`.
- Rotas de músicas, setlists, itens do repertório e reordenação.
- Dados fictícios iniciais, inseridos apenas quando o arquivo do banco é criado pela primeira vez. Esvaziar a biblioteca não faz os exemplos retornarem.

**Validação desta implementação:** `node --test` passou nos 10 testes com SQLite temporário, incluindo CRUD HTTP, vínculos, cascatas, reordenação, JOIN, COUNT/SUM, validações e fechamento/reabertura do servidor e banco. No navegador integrado foram verificados cadastro e edição, inclusão de músicas, reordenação, total 07:25, recarregamento, busca e layout em 390 e 1366 px. Exclusões foram executadas pela API nos testes; no navegador foi conferida a confirmação e seu cancelamento. Consulte o histórico para limites da evidência.

## 3. Como abrir e executar

Requisitos: Node.js `>=22.13.0`; recomendado Node.js 24 LTS. O código atual **não precisa de dependências externas instaladas pelo npm**.

```bash
node server.js
```

Depois, visitar `http://localhost:3000`. Usar `node --watch server.js` para modo observação de mudanças. Com npm disponível, `npm start` e `npm run dev` são equivalentes. No terminal desta sessão, npm não estava disponível, mas o Node.js 24.22.1 estava.

Para começar os testes sem dados pré-existentes, usar uma **cópia de trabalho** e não apagar o banco de produção/da demonstração sem consentimento. O arquivo `.sqlite` é ignorado pelo Git.

## 4. Como orientar o Codex no primeiro contato

Copie e envie esta mensagem ao Codex, preferencialmente com a pasta SETLIST aberta:

> Você vai atuar como desenvolvedor e revisor do SETLIST, um projeto acadêmico de organizador de repertórios musicais. Antes de programar, leia `AGENTS.md` e todos os arquivos em `docs/`, depois examine `README.md`, `server.js`, `database/schema.sql`, `database/consultas.sql`, `public/index.html` e `public/app.js`. Sua primeira resposta deve ser um diagnóstico curto: (1) requisitos do enunciado, (2) o que já está implementado e foi realmente verificado, (3) lacunas e riscos, e (4) plano mínimo priorizado. Não reescreva nem amplie o projeto sem necessidade. Preserve o banco SQLite, a estrutura existente e os dados do usuário. Ao implementar, faça mudanças pequenas, teste o que alterar e atualize `docs/04_HISTORICO_E_DECISOES.md` com evidências e pendências. Se alguma informação não estiver confirmada, marque como hipótese ou peça uma decisão específica. Objetivo final: demonstrar CRUD, tabelas relacionadas, JOIN, agregação e integração front-end/back-end/banco na apresentação de 16/11/2026.

## 5. O que entregar ao final

- Código executável localmente e instruções de uso confiáveis.
- Banco com no mínimo duas tabelas relacionadas com PK/FK (a solução proposta usa três).
- CRUD demonstrável pela interface.
- Uma consulta `JOIN` e outra com `SUM` e/ou `COUNT` executáveis.
- Prova de persistência: registros continuam presentes após reiniciar o servidor.
- Roteiro enxuto para uma demonstração em sala.
- Histórico de alterações e quaisquer limitações ainda existentes.

**Princípio central:** funcionar nos critérios avaliados é mais importante que adicionar recursos que não foram solicitados.
