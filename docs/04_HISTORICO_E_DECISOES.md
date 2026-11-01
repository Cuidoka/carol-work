# SETLIST — Histórico de desenvolvimento, decisões e pendências

Este é o registro permanente **dentro do repositório** para o agente de programação acompanhar mudanças verificáveis. Ele não substitui o histórico real de conversa, e não deve fingir lembrar informações que não estão nos arquivos disponíveis.

## Estado inicial documentado — 01/11/2026

> **Nota da auditoria desta sessão:** a seção inicial abaixo veio nos documentos recebidos. As afirmações de código inspecionado e testes com Node.js 22.16.0 não puderam ser confirmadas: só havia seis arquivos Markdown na pasta. O usuário esclareceu que nada havia sido criado e autorizou a implementação do zero. O registro original foi preservado como contexto; a entrada “Primeira implementação” abaixo descreve o estado realmente verificado.

### Contexto confirmado

- Trabalho acadêmico com apresentação em 16/11/2026 e valor de 3,0 pontos.
- Tema escolhido: SETLIST, organizador de repertórios musicais.
- Prioridade: cumprir exclusivamente os requisitos da professora, sem transformar o MVP em produto completo.
- Requisitos: 2+ tabelas relacionadas, PK/FK, CRUD, JOIN, agregação ou subconsulta, integração front/back/banco.

### Código existente inspecionado

- `server.js`: servidor HTTP, API, validações, SQLite.
- `public/index.html`, `styles.css`, `app.js`: interface e chamadas HTTP.
- `database/schema.sql`: três tabelas relacionadas.
- `database/consultas.sql`: JOIN, COUNT, SUM e contagem extra.
- `package.json`: Node.js sem dependências externas, comandos `start` e `dev`.
- `README.md`: instruções e roteiro de apresentação.

### Verificação técnica realizada durante a documentação

Foi feita uma execução isolada do projeto com Node.js 22.16.0 e banco temporário. Foram confirmados via HTTP e SQLite:

- Inicialização do servidor com dados fictícios e entrega do HTML.
- GET/POST/PUT/DELETE de músicas e operações de setlists.
- Associação/desassociação de músicas e mudança de ordem.
- Resultado de agregação com COUNT/SUM e consulta SQL com JOIN.

**Limites da evidência:** a verificação não incluiu navegação manual no navegador, testes visuais, múltiplos usuários, carga, acessibilidade nem deploy. Os testes devem ser refeitos em cada ambiente após alterações.

### Decisões vigentes

| ID | Decisão | Justificativa |
|---|---|---|
| D-001 | Escopo limitado ao trabalho acadêmico | Entregar apenas o que vale nota |
| D-002 | Música e setlist têm CRUD completo | Atender requisito com demonstração clara |
| D-003 | Três tabelas com vínculo N:N | Permitir reutilizar música em diferentes repertórios |
| D-004 | Duração no SQLite em segundos | Simplificar soma, ordenação e validação |
| D-005 | Stack atual sem serviços externos | Reduzir riscos e dependências para a apresentação |
| D-006 | Sem login, streaming, upload ou APIs terceiras | Não são exigidos |
| D-007 | O Codex deve auditar antes de alterar | Evitar regressões e retrabalho |

### Pendências antes da entrega

- [ ] Executar o projeto e fazer testes manuais no navegador da máquina de apresentação.
- [ ] Confirmar as operações de ponta a ponta, incluindo persistência após reinício.
- [ ] Conferir mensagem de erro e responsividade suficiente para a apresentação.
- [ ] Ensaiar roteiro da professora com dados fictícios.

## Modelo para próximas entradas

Ao implementar uma mudança, **acrescentar uma entrada nova**, preservando registros anteriores:

```markdown
## AAAA-MM-DD — [resumo da alteração]

**Objetivo:** requisito ou defeito motivador.
**Estado anterior verificado:** o que acontecia de fato.
**Arquivos alterados:** caminhos relativos.
**Decisão técnica:** escolha e justificativa.
**Testes realizados:** comandos, cenários e resultado.
**Pendências e riscos:** o que não foi confirmado.
**Status:** concluído / parcial / bloqueado.
```

Não adicionar registros retroativos fictícios nem afirmar que uma verificação aconteceu sem sua execução real.

## 2026-11-01 — Primeira implementação do SETLIST

**Objetivo:** criar o MVP local autorizado pelo usuário, cumprindo CRUD, PK/FK, JOIN, agregação e integração real, para a apresentação de 16/11/2026.

**Estado anterior verificado:** `Get-ChildItem -Force -Recurse` e `rg --files --hidden` mostraram somente `AGENTS.md` e os cinco documentos numerados na raiz. Não existiam código, banco ou diretórios da aplicação. O usuário confirmou: “Não há nada criado, apenas os documentos” e autorizou implementar tudo. O histórico anterior não era evidência de execução nesta pasta.

**Arquivos criados:**

- `server.js`: HTTP nativo, rotas do contrato, validações, SQL parametrizado, criação do banco, exemplos iniciais e servidor restrito a `127.0.0.1`.
- `database/schema.sql`: tabelas `musicas`, `setlists`, `setlist_musicas`; PK, FK com cascata, CHECKs, UNIQUE e índices.
- `database/consultas.sql`: JOIN, agregação COUNT/SUM com LEFT JOIN/COALESCE e COUNT da biblioteca.
- `database/consultar.js`: execução das consultas, abrindo o banco em modo somente leitura.
- `public/index.html`, `public/styles.css`, `public/app.js`, `public/favicon.svg`: duas telas, formulários de criação/edição, confirmação de exclusão, busca, seleção, inclusão/remoção de vínculos, setas de ordem e totais.
- `tests/integration.test.js`: integração HTTP com SQLite temporário, sem tocar no banco de demonstração.
- `package.json`, `.gitignore`, `dados/.gitkeep`, `README.md`.

**Documentação alterada:** os cinco documentos numerados foram movidos para `docs/`, conforme os caminhos já exigidos por `AGENTS.md`. Os documentos 00, 02 e 03 foram corrigidos para refletir a primeira implementação e a forma de execução/testes. Este histórico preserva o texto recebido e registra a divergência. O documento de escopo 01 foi preservado, apenas movido.

**Decisões técnicas:**

- Preservados a stack, o modelo N:N e o contrato HTTP especificados. Sem dependências npm externas, login, áudio, serviços terceiros ou hospedagem.
- Durações em segundos, de 1 a 36.000. Interface recebe minutos:segundos; títulos/nomes/artistas obrigatórios de até 120 caracteres.
- FKs explicitamente habilitadas. Uma música não se repete na mesma setlist. Exclusões usam ON DELETE CASCADE somente nos vínculos.
- Reordenação exige exatamente os IDs associados, sem repetição, e grava em transação. Remoção pode deixar lacunas em `posicao`, conforme limitação já aceita no documento 02.
- **Ajuste em relação à especificação inicial:** exemplos são inseridos somente quando o arquivo do banco é criado, não sempre que a biblioteca estiver vazia. Isso evita restaurar faixas que o usuário excluiu deliberadamente.
- `SETLIST_DB_PATH` permite banco isolado, `SETLIST_SEED=0` permite banco novo sem exemplos, `PORT` permite porta alternativa. Padrão: `dados/setlist.sqlite`, porta 3000.
- A interface trata erros da API, evita envios simultâneos e mostra feedback. Textos dos registros são escapados antes de entrar no HTML.

**Testes realizados e resultados observados:**

1. `node --version`: **v24.22.1**. `npm test` não executou porque npm não está disponível neste terminal. O projeto funciona diretamente com Node; essa alternativa foi documentada.
2. `node --test`: a primeira execução no sandbox bloqueou conexões a `127.0.0.1` com `EACCES`. Reexecutado com a permissão local necessária: **10 testes passaram, 0 falhas**. Cobertura: arquivos públicos/privados, PK/FK/CHECK/UNIQUE reais, CRUD de ambas entidades, reutilização N:N, duplicidade HTTP 409, reordenação e rejeição de listas inválidas, JOIN e COUNT/SUM lidos de `consultas.sql`, atualização das somas, persistência ao reabrir servidor/banco, remoção de vínculo sem apagar música, ambas as cascatas, setlist vazia, `foreign_key_check`, validação de campos/IDs/JSON/tamanho/tipo e não reinserção dos exemplos após esvaziar banco.
3. `node server.js`: iniciou em `http://localhost:3000` com 5 músicas, 1 repertório e 3 vínculos fictícios. Os dados desta instância não foram usados para testes destrutivos.
4. `node --check server.js` e `node --check public/app.js`: ambos sem erros de sintaxe.
5. `node database/consultar.js`: execução real em modo leitura; JOIN retornou 3 faixas; agregação retornou **3 músicas / 656 segundos**; biblioteca retornou **5 músicas**.
6. Navegador integrado com outra instância na porta 3001 e banco temporário `%TEMP%/setlist-ui-01a19551.sqlite`: criou “Teste 01” com 03:20, editou para 04:10, criou “Teste 02” com 03:15, criou “Apresentação Teste”, adicionou ambas, exibiu **07:25**, moveu a segunda faixa para cima e editou nome para “Apresentação validada”. Recarregamento preservou nome, sequência e duração. Duração 00:00 recusada com mensagem compreensível. Busca por artista/título filtrou a tabela.
7. A instância temporária foi encerrada e reiniciada como novo processo `node server.js`. O navegador voltou a mostrar “Apresentação validada”, sequência Teste 02 → Teste 01 e total 07:25. Console do navegador: **nenhum erro ou aviso retornado** durante a inspeção.
8. Layout inspecionado em **390×844** e **1366×900**. Sem transbordamento horizontal do documento; a lista de cartões permite rolagem horizontal em tela pequena. No navegador, foi conferido o diálogo de exclusão do repertório e seu cancelamento; **a confirmação final da exclusão e a remoção de vínculo não foram acionadas visualmente**. Essas operações foram executadas nos testes HTTP/SQLite.

**Pendências e riscos:** ensaiar na máquina e no navegador da apresentação; verificar manualmente ali as exclusões/remoção pela interface usando dados descartáveis. Não foram testados outros navegadores, carga, múltiplos usuários nem auditoria completa de acessibilidade. `npm start` não foi executado nesta sessão por ausência do npm; `node server.js` foi executado. Os limites não alteram a implementação dos requisitos, mas não devem ser descritos como testes realizados.

**Status:** MVP implementado e validado pelas evidências acima; preparação/ensaio da apresentação permanece pendente.

## 2026-11-01 — Auditoria dos requisitos e validação das exclusões pela interface

**Objetivo:** conferir o projeto atual contra o enunciado, executar os testes existentes e verificar integralmente CRUD, relacionamento, SQL e persistência, incluindo as três operações de remoção que antes só tinham sido executadas por HTTP.

**Arquivos inspecionados:** `AGENTS.md`, `README.md`, os cinco documentos de `docs/`, `package.json`, `.gitignore`, `server.js`, `public/index.html`, `public/app.js`, `database/schema.sql`, `database/consultas.sql`, `database/consultar.js` e `tests/integration.test.js`. Os estilos e a estrutura visual já haviam sido inspecionados na implementação anterior; a responsividade não foi reexecutada nesta auditoria.

**Isolamento:** todos os cadastros, alterações e exclusões desta auditoria ocorreram em uma nova instância na porta **3003**, com `SETLIST_SEED=0` na criação e `SETLIST_DB_PATH=C:/Users/siltu/AppData/Local/Temp/setlist-auditoria-8cda780f-dfa9-4aad-9bfa-cfcc4f2faeba.sqlite`. Não foram executadas mutações no banco `dados/setlist.sqlite`. Os testes automatizados também usam seus próprios bancos temporários.

### Comandos e resultados reais

- `node --version`: **v24.22.1**, compatível com o requisito do projeto.
- `node --test` com permissão para conexões HTTP locais: **10 testes passaram, 0 falhas**, sem cancelamentos nem testes ignorados. A suíte executou CRUD de músicas e setlists, PK/FK/CHECK/UNIQUE, associação N:N, rejeição de duplicidade, reordenação válida e inválida, JOIN/COUNT/SUM do arquivo SQL, atualização de totais, cascatas, setlists vazias, validações HTTP e fechamento/reabertura de servidor e SQLite.
- `node server.js` com as variáveis acima: iniciou e serviu a interface em `http://localhost:3003`. Foi encerrado e iniciado novamente **duas vezes**, mantendo o mesmo banco.
- `node --check server.js` e `node --check public/app.js`: sem erros de sintaxe.
- `node database/consultar.js`, apontando para o banco de auditoria: antes das exclusões, JOIN retornou as duas faixas na ordem B → A, COUNT retornou 2 músicas e SUM retornou **445 segundos (07:25)**. Depois das exclusões, JOIN ficou vazio e a agregação manteve `Show B` com **0 músicas / 0 segundos**, enquanto o COUNT da biblioteca retornou **1 música**. Resultados coerentes com os registros esperados.
- Consultas diretas em `DatabaseSync` aberto com `{ readOnly: true }` confirmaram os dados persistidos em cada etapa abaixo. `PRAGMA foreign_key_list(setlist_musicas)` mostrou as duas referências corretas, ambas com `ON DELETE CASCADE`. `PRAGMA foreign_key_check` retornou lista vazia; `PRAGMA integrity_check` retornou `ok` na conferência anterior às exclusões.

### Operações realmente executadas no navegador integrado

| Operação | Cenário e resultado observado |
|---|---|
| Criar/consultar música | Cadastrada `Auditoria A`, `Banda A`, 03:20; apareceu na tabela da biblioteca. |
| Editar música | Alterados os três campos para `Auditoria A editada`, `Banda A editada`, 04:10. SQLite confirmou os textos e 250 segundos. |
| Segunda música | Cadastrada `Auditoria B`, `Banda B`, 03:15; SQLite confirmou 195 segundos. |
| Criar/consultar setlist | Criado `Show A`, evento `Campus`; a interface mostrou o repertório e seu detalhe. |
| Incluir músicas | Adicionadas A e B pelo seletor e botão Adicionar; apareceram os dois vínculos. Após incluir ambas, não havia opção para incluí-las novamente. A rejeição de duplicidade no servidor foi executada pela suíte HTTP. |
| Reordenar | B movida para cima pela seta; tela mostrou B → A e SQLite confirmou posições 1 e 2. |
| Editar setlist | Nome alterado para `Show A editado` e evento para `Auditório editado`. Ambos confirmados no SQLite. |
| Persistência inicial | Recarregada a página e, depois, encerrado/reiniciado o processo do servidor. Nome, evento, músicas, artistas, durações, ordem e total 07:25 reapareceram corretamente. |
| Remover somente o vínculo | Acionado `×` de A no Show A. Restou B no repertório, com total 03:15. A continuou na biblioteca e no seletor. Consulta SQLite confirmou 2 músicas e somente o vínculo com B. |
| Reutilizar música | A readicionada ao Show A e incluída também em um novo `Show B`, com evento opcional vazio. |
| Cancelar exclusão | Aberto o diálogo de excluir A e acionado Cancelar; foi possível abrir o mesmo diálogo novamente, sem perder o registro. |
| Excluir música pela interface | Confirmada a exclusão de A. Após recarregar, a biblioteca continha somente B. SQLite confirmou que A e seus vínculos nos dois repertórios foram removidos, os dois repertórios continuaram existentes e o vínculo Show A → B permaneceu. |
| Excluir repertório pela interface | Selecionado Show A, que ainda continha B, e confirmada sua exclusão. Após recarregar, restou Show B; B continuou na biblioteca. SQLite confirmou 1 música, 1 setlist e nenhum vínculo. |
| Persistência das exclusões | Após o segundo reinício completo do processo e recarregamento, Show A e A continuaram ausentes; Show B vazio e B com 03:15 continuaram presentes. |

O console do navegador retornou **nenhum erro ou aviso** nas inspeções finais. Foi salva uma captura da biblioteca restante após o último reinício em `C:/Users/siltu/.codex/visualizations/2026/11/01/01a19551-2619-7be3-8db5-f722e225d807/auditoria-setlist.jpg`.

### Falhas, alterações e limites

**Falhas funcionais comprovadas:** nenhuma nos cenários executados. **Correções no código:** nenhuma necessária. **Arquivo alterado nesta auditoria:** somente `docs/04_HISTORICO_E_DECISOES.md`, com este registro. Nenhuma funcionalidade adicionada.

**Ocorrências do ambiente:** npm continuou indisponível no terminal (`Get-Command npm` não retornou comando); `npm start`/`npm test` não foram executados. Os comandos diretos do Node funcionaram. Uma primeira consulta de leitura ao banco de auditoria usou `$env:TEMP` do sandbox, cujo diretório difere do processo iniciado com permissão ampliada; retornou “Banco não encontrado”. Corrigido o comando para o caminho absoluto informado pelo servidor, a leitura passou. Isso não exigiu alteração na aplicação. Uma tentativa auxiliar de calcular hash do banco principal aberto foi recusada pelo bloqueio do arquivo; não se usou hash como evidência de preservação.

**Limites:** não foram repetidos nesta auditoria os testes responsivos anteriores; não foram testados outros navegadores, carga, uso simultâneo ou auditoria completa de acessibilidade. Não foi realizado ensaio oral nem validação em outra máquina. O ambiente da apresentação deve ter Node compatível e uma porta disponível; a alternativa `PORT` foi efetivamente usada nesta sessão. A instância descartável foi encerrada ao terminar a auditoria.

**Conclusão:** todos os requisitos acadêmicos solicitados são demonstráveis no ambiente local verificado, incluindo as exclusões finais pela interface. O projeto está **tecnicamente apto à apresentação de 16/11/2026 neste ambiente**. Permanece necessário ensaiar e confirmar o ambiente da sala; isso não é falha funcional do software. As pendências de exclusão/remoção visual das entradas anteriores foram resolvidas por esta auditoria.

## 2026-11-01 — Segunda versão isolada para Vercel + Turso/libSQL

**Solicitação e autorização:** o usuário pediu preservar a versão pronta e criar outra para deploy na Vercel. Essa é uma ampliação explícita em relação ao escopo local original; a versão acadêmica continua independente. O usuário informou que acessa a Vercel pelo GitHub e ainda não configurou o banco remoto.

**Decisão:** criada a pasta `vercel/` como projeto independente. O frontend, `schema.sql` e `consultas.sql` foram copiados sem alterações. A API foi adaptada ao formato Web Request/Response de uma função Node.js, usando `@libsql/client` 0.18.0; o módulo de produção importa o cliente HTTP e exige URL/token do Turso no servidor. Não há fallback para SQLite em arquivo na Vercel, nem importação do banco da apresentação. O banco online começa vazio e os dois ambientes têm dados independentes.

**Arquivos criados:**

- `vercel/package.json` e `package-lock.json`: dependência isolada e scripts de teste, verificação, preview, inicialização do banco e teste por URL.
- `vercel/vercel.json`: Root Directory esperado `vercel`, saída estática `public`, encaminhamento das rotas `/api/...` à função e cabeçalhos básicos.
- `vercel/api/index.mjs`, `lib/handler.mjs`, `lib/database.mjs`: CRUD assíncrono, SQL parametrizado, transações de leitura/escrita, validação de FKs na conexão da transação, JOIN, COUNT/SUM, duplicidade e cascatas. Recusa operações se a integridade estiver desabilitada; erros não revelam credenciais.
- `vercel/public/*` e `vercel/database/*.sql`: cópias da versão local.
- `vercel/dev.mjs`: preview local, com o mesmo handler; usa banco remoto configurado ou cliente descartável injetado pelos testes.
- `vercel/scripts/init-db.mjs`: cria esquema sem apagar dados nem importar o banco local; verifica FKs. Não foi executado em banco remoto.
- `vercel/scripts/check.mjs`: checks de sintaxe, presença de arquivos e estrutura básica de configuração. Não equivale a build da infraestrutura Vercel.
- `vercel/scripts/smoke.mjs`: teste contra uma URL HTTP/HTTPS; cria registros próprios e verifica CRUD, duplicidade, ordem, JOIN, COUNT/SUM, remoções e cascatas, limpando somente os IDs criados por ele. Validado contra preview local; não foi executado na Vercel.
- `vercel/checks/integration.mjs`: testes isolados com driver libSQL real e arquivo temporário. Localização fora de `tests/` evita que `node --test` da versão original passe a exigir a dependência da segunda versão.
- `vercel/.env.example`, `.gitignore`, `.vercelignore`, `README.md`: configuração sem credenciais, exclusões de arquivos privados e passo a passo de banco/deploy/validação.

**Outros arquivos alterados:** `README.md` da raiz recebeu somente um aviso e link explicando as duas versões; este histórico foi atualizado. Servidor, frontend, schema, banco e dependências da versão local foram preservados.

**Testes e resultados reais:**

1. Instalado o cliente oficial apenas em `vercel/node_modules`; npm foi executado por meio do runtime disponível (`pnpm dlx npm@11.6.2`), pois npm não está no PATH. Um primeiro comando sem `workdir` efetivo apenas gerou um lockfile vazio na raiz; esse arquivo novo foi removido. A instalação efetiva e o lockfile pertencem a `vercel/`. Nenhum pacote foi adicionado ao `package.json` original.
2. `node scripts/check.mjs`, na pasta `vercel/`: passou. Sintaxe/configuração/arquivos verificados localmente, sem executar build na Vercel.
3. `node --test checks/integration.mjs`, na pasta `vercel/`, com acesso HTTP local autorizado: **9 testes passaram, 0 falhas**. Cobertura: CRUD, relacionamento N:N, rejeição de duplicidade, ordem válida/inválida, JOIN/COUNT/SUM executados do SQL, atualização de duração, persistência ao fechar/recriar cliente/handler, remoção de vínculo, ambas as cascatas, integridade, entradas inválidas, respostas sem cache, arquivos privados inacessíveis e teste por URL contra preview HTTP real. Confirmado que o teste por URL limpa seus registros e preserva o registro preexistente do banco descartável.
4. Na primeira execução dessa suíte, os cenários funcionais passaram, mas a limpeza do arquivo temporário falhou com `EBUSY` no Windows. Acrescentadas tentativas de remoção após fechar o cliente. A suíte completa passou nas execuções posteriores; não houve mudança no comportamento do produto para tratar esse problema do ambiente de testes.
5. `node --test`, na raiz: **10 testes passaram, 0 falhas**, mantendo a versão local independente. Os hashes SHA-256 de `server.js`, `public/app.js`, `public/index.html` e `database/schema.sql` foram comparados antes/depois e permaneceram iguais. A suíte da segunda versão também compara byte a byte todas as cópias de frontend/SQL com a versão local.
6. O entrypoint real `api/index.mjs` foi importado nos testes e retornou HTTP 503 explícito quando faltam variáveis de banco, sem criar banco temporário silencioso nem expor token.

**Publicação e pendências:** foi encontrada a integração Vercel e sugerida sua conexão, mas não foi confirmada conexão à conta. Não há banco Turso/credenciais configurados, repositório publicado por esta sessão nem URL de deployment. **Não foi realizado deploy e não foi validado o transporte HTTP até um banco Turso remoto.** Também não houve novo teste visual no navegador da segunda versão; a interface é uma cópia idêntica daquela auditada. Para concluir: criar banco remoto compatível com libSQL, executar o schema, configurar `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`, importar no GitHub/Vercel usando Root Directory `vercel`, e executar o teste por URL e os cenários visuais do README dessa pasta. O usuário não deve enviar tokens no chat nem versioná-los.

**Status:** versão local preservada e testada; segunda versão implementada e validada localmente, **deploy e validação online pendentes de configuração das contas/banco**. Não declarar a versão Vercel como publicada ou pronta em produção com base nesses testes locais.

## 2026-11-01 — Versão Vercel alterada de Turso para Neon/PostgreSQL

**Autorização e objetivo:** após comparar alternativas de configuração, o usuário escolheu explicitamente “Vamos fazer para o NEON”. Essa decisão substitui o Turso apenas na pasta `vercel/`; a versão acadêmica local continua com Node.js nativo + SQLite. A motivação é configurar o banco pela integração Neon gerenciada no painel da Vercel, aproveitando o login GitHub já utilizado pelo usuário.

**Implementação:**

- Substituído `@libsql/client` por `@neondatabase/serverless` **1.2.0** em `vercel/package.json`/`package-lock.json`. Adicionado `@electric-sql/pglite` **0.5.14** somente em `devDependencies`, para testes com PostgreSQL em WASM e arquivos temporários.
- `vercel/lib/database.mjs` agora exige apenas **`DATABASE_URL`** (`postgresql://...`/`postgres://...`). Cada requisição cria um Client Neon via WebSocket e o encerra ao terminar. Node.js 24 fornece WebSocket nativo. Não há fallback em disco na Vercel, conexão reutilizada entre requisições ou variáveis Turso no código ativo.
- `vercel/lib/handler.mjs`: parâmetros SQL `$1`, `$2` etc.; INSERT com `RETURNING id`; transações PostgreSQL; bloqueio de linha da setlist em alterações; rollback em falhas e liberação de conexão. COUNT/SUM convertidos para números JSON, preservando a interface. Restrição UNIQUE mapeada para HTTP 409. IDs positivos limitados à faixa INTEGER do schema PostgreSQL.
- `vercel/database/schema.sql`: três tabelas equivalentes ao modelo original, com `GENERATED ALWAYS AS IDENTITY`, PK/FK, cascatas, CHECK, UNIQUE, índices e `TIMESTAMPTZ`. O arquivo cria o schema transacionalmente e não apaga registros. Destinado a **banco Neon novo e dedicado**, sem migração/importação automática de SQLite ou Turso.
- `vercel/database/consultas.sql`: JOIN mantido e agregações com casts PostgreSQL apropriados.
- `vercel/scripts/init-db.mjs`: aplica o schema PostgreSQL e verifica as duas FKs com cascata em `pg_constraint`, sem acessar o banco local.
- `vercel/checks/integration.mjs`: testes migrados de libSQL para PGlite; o adaptador de testes fornece a interface `connect/query/release` consumida pelo handler e executa SQL PostgreSQL real, sem respostas de banco simuladas. O transporte Neon/WebSocket não é executado por esse adaptador.
- `vercel/dev.mjs`: atualizado comentário do banco de testes. `vercel/.env.example` agora contém apenas exemplo de DATABASE_URL, sem credenciais reais.
- `vercel/README.md`: roteiro para conectar Neon por Storage/Marketplace, confirmar DATABASE_URL, executar o schema PostgreSQL no SQL Editor, redeploy e validação por URL. Continua exigindo Root Directory **`vercel`**. Atualizados o aviso da raiz `README.md` e a distinção entre versões no documento 02.

**Preservação da versão original:** os hashes SHA-256 de `server.js`, `public/app.js`, `public/index.html` e `database/schema.sql` permaneceram iguais aos registrados antes da segunda versão. A interface copiada em `vercel/public/` também foi comparada byte a byte nos testes e continua idêntica. Nenhuma escrita foi executada em `dados/setlist.sqlite` nesta migração; o schema PostgreSQL está somente em `vercel/database/`.

**Testes realmente executados:**

1. Instaladas as dependências somente em `vercel/`, usando o npm oficial via runtime disponível. Depois, **`npm ci --ignore-scripts --no-audit --no-fund`** (invocado por `pnpm dlx npm@11.6.2`) confirmou instalação reproduzível do lockfile: somente Neon e PGlite instalados. npm continua sem comando próprio no PATH do terminal desta sessão.
2. `node scripts/check.mjs`, em `vercel/`: **passou**; sintaxe, arquivos estáticos e configuração básica verificados. Não foi executado build na infraestrutura Vercel.
3. `node --test checks/integration.mjs`, em `vercel/`: **11 testes passaram, 0 falhas**. Confirmados no PostgreSQL/PGlite: três PKs, duas FKs com cascata, CHECK e UNIQUE pelo catálogo/execução; CRUD de músicas e repertórios; N:N; rejeição de duplicidade; JOIN e COUNT/SUM do arquivo SQL; valores numéricos JSON; mudança de duração; ordem válida/inválida; remoção de vínculo e ambas as exclusões; persistência após fechar/reabrir o motor em disco; IDs/JSON/payload inválidos; arquivos privados inacessíveis; endpoint sem credenciais retornando 503; igualdade do frontend com a versão local.
4. O teste de rollback força um **erro SQL real** depois do primeiro UPDATE da reordenação: o handler retorna 503, libera a conexão e o PostgreSQL conserva a ordem/posições anteriores após ROLLBACK.
5. O teste de HTTP local executou também `scripts/smoke.mjs` contra o preview descartável, verificando as operações e a limpeza somente dos IDs criados pelo teste, preservando o registro preexistente.
6. `node --test`, na raiz: **10 testes passaram, 0 falhas**. A versão local segue independente e sem precisar das dependências Neon/PGlite.

**Resultado/limites:** adaptação e testes locais concluídos. A integração Neon foi encontrada e sugerida, mas sua instalação/conexão à conta não foi confirmada. Não há DATABASE_URL real configurada nesta sessão e não foi criado banco, executado SQL remoto ou realizado deploy. **Não foram testados Neon remoto, conexão WebSocket em produção, roteamento/build real da Vercel ou navegador nessa URL.** Os 11 testes locais não substituem essa validação. O roteiro no README foi conferido com a documentação oficial da integração Neon gerenciada pela Vercel e do driver Neon.

**Próximo passo externo:** conectar/criar Neon no painel Vercel, executar `vercel/database/schema.sql` no banco selecionado, confirmar DATABASE_URL nos ambientes desejados e fazer deploy/redeploy. Depois executar o teste por URL e os fluxos no navegador. A conexão contém senha e não deve ser enviada no chat ou versionada.

**Status:** versão local preservada; versão Vercel preparada para **Neon**, validada localmente; configuração e validação online continuam pendentes. As instruções Turso da entrada histórica anterior foram substituídas pelo README atual, sem apagar o registro da decisão anterior.
