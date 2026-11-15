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

## 2026-11-07 — Revisão dos requisitos e guia para a apresentação

**Solicitação:** o usuário pediu confirmar todos os requisitos e receber uma explicação para apresentar à professora sobre funcionamento, CRUD, banco de dados, front-end e back-end.

**Inspeção:** relidos AGENTS, README e documentos numerados de escopo, arquitetura, roteiro e histórico; conferidos os arquivos atuais de servidor, front-end, schemas, consultas, contratos, dependências, scripts e testes das duas versões. O código continua com versão local SQLite na raiz e versão Neon/PostgreSQL isolada em `vercel/`. O frontend de ambas continua idêntico, conforme teste byte a byte.

**Verificação automatizada realmente executada:**

- `node --version`: **v24.22.1**.
- `node --test`, na raiz, com HTTP local autorizado: **10 passaram, 0 falhas**. CRUD, integridade, vínculos, ordem, consultas, cascatas e persistência confirmados em bancos descartáveis.
- `node scripts/check.mjs`, em `vercel/`: **passou**, limitado a sintaxe, arquivos estáticos e configuração básica.
- `node --test checks/integration.mjs`, em `vercel/`: **11 passaram, 0 falhas**. SQL executado em PostgreSQL/PGlite temporário; inclui CRUD, catálogo de constraints, agregações, rollback após erro SQL real, persistência, cascatas e smoke por HTTP local.

**Nova execução no navegador, sem tocar no banco principal:**

Instância iniciada por `node server.js` com `PORT=3005`, `SETLIST_SEED=0` e banco `C:/Users/siltu/AppData/Local/Temp/setlist-revisao-20261107-ff529848-90e0-44be-a646-97bd27173b6b.sqlite`.

1. Criada `Ensaio A`, artista `Banda A`, duração 03:20. Editados título para `Ensaio A editada` e duração para 04:10. Criada `Ensaio B`, artista `Banda B`, duração 03:15. As linhas apareceram na biblioteca.
2. Criada setlist `Ensaio da apresentação`, evento `Sala de aula`; adicionadas as duas faixas, movida B para cima e editado nome para `Ensaio validado`. Após recarregar: sequência B → A, evento preservado, **2 músicas / 07:25**.
3. `node database/consultar.js` apontando para esse arquivo: JOIN retornou as duas faixas nas posições 1 e 2; COUNT/SUM retornou **2 / 445 segundos**; COUNT da biblioteca retornou **2**. `PRAGMA foreign_key_check` retornou `[]`; `PRAGMA integrity_check` retornou `ok`.
4. Encerrado e iniciado novamente o processo usando o mesmo banco; navegador recarregado confirmou nome, evento, ordem e total 07:25.
5. Removida A do repertório por `×`; continuou na biblioteca e o repertório ficou com B. Excluída B da biblioteca com confirmação final; o repertório ficou vazio e A foi preservada. A foi readicionada ao repertório, depois a setlist foi excluída com confirmação final; A permaneceu na biblioteca após recarregar.
6. Consulta direta de leitura no SQLite após essas operações confirmou **1 música (`Ensaio A editada`, 250 segundos), 0 setlists, 0 vínculos**, e `foreign_key_check=[]`. Console do navegador: nenhum erro/aviso retornado nas inspeções finais. A instância descartável foi encerrada ao terminar; não foram executadas mutações em `dados/setlist.sqlite`.
7. Captura do estado de 2 faixas / 07:25 salva em `C:/Users/siltu/.codex/visualizations/2026/11/01/01a19551-2619-7be3-8db5-f722e225d807/revisao-2026-11-07.jpg`.

**Requisitos:** todos os itens do enunciado registrado no documento 01 estão implementados e demonstráveis na versão local: 3 tabelas relacionadas, PK/FK, CRUD, JOIN, agregação por COUNT/SUM e integração real. Não é necessário implementar subconsulta adicional, pois o enunciado pede agregação OU subconsulta. Hospedagem online foi uma solicitação posterior, não requisito original.

**Alterações:** criado `docs/05_GUIA_PARA_APRESENTAR_E_RESPONDER.md` com explicação fiel ao código, falas sugeridas, exemplos SQL, mapa CRUD/HTTP/SQL, relação N:N, exclusões, transações, diferenças entre versões e roteiro de ensaio. Atualizados os links no README e no documento 00 e o resumo de validação do documento 00, que ainda remetia à etapa anterior às exclusões visuais. Somente documentação alterada; não foi necessária correção funcional.

**Limites:** não foram feitos novos testes de responsividade, outros navegadores, carga ou múltiplos usuários. Não foi realizada validação em outra máquina, ensaio oral do aluno ou conexão ao Neon remoto. Não foram encontrados `.env.local` ou `.vercel/project.json` na pasta da segunda versão; isso não prova inexistência de um deploy externo, apenas ausência desses vínculos locais. Nenhuma URL externa foi fornecida/validada nesta revisão. Não declarar a infraestrutura online pronta com base nos testes PGlite.

**Conclusão:** versão local tecnicamente apta para demonstração acadêmica em 16/11/2026 no ambiente verificado; todos os requisitos originais atendidos. Falta ao aluno ensaiar a explicação e conferir a máquina da apresentação. A segunda versão permanece preparada e testada localmente, com validação online pendente. Nenhuma falha funcional encontrada nos cenários executados.

## 2026-11-07 — Conversão integral do front-end para React + Tailwind + Vite

**Autorização:** o usuário pediu reformular todo o projeto usando frameworks, principalmente React e Tailwind. Essa decisão substitui a restrição anterior a um front-end sem frameworks. Os requisitos acadêmicos, os dois bancos e os contratos das APIs foram preservados.

**Proteção e reversibilidade:** criado `backups/pre-react-2026-11-07.zip` com o código e a documentação anteriores, sem `node_modules`, bancos, `.git` ou arquivos `.env`. A pasta de backups é ignorada pelo Git. Não foram apagados ou substituídos registros de `dados/setlist.sqlite`; os testes usaram arquivos temporários. Os schemas SQLite e PostgreSQL e a lógica SQL/CRUD permaneceram sem migração de dados.

### Arquitetura resultante

- Uma única interface React em `src/`, usada pelos back-ends SQLite e Neon. Removidas a implementação manual `public/app.js`/`index.html`/`styles.css` e as cópias de `vercel/public/`. `public/` mantém o favicon.
- Componentes em `src/components/`: biblioteca, lista/detalhe de repertórios, edição, diálogo, ícones e botões. `src/App.jsx` compõe as telas e as ações. React controla a renderização, sem montar strings de HTML para os registros.
- `src/hooks/useSetlistData.js` centraliza carregamento, seleção e mutações; controla concorrência das respostas para evitar uma seleção antiga sobrescrever a atual. `src/lib/api.mjs` trata HTTP/JSON e erros; `src/lib/format.mjs` concentra conversão/validação de duração.
- Tailwind integrado ao Vite pelo plugin oficial. Tokens e estilos de base em `src/styles.css`; aparência e responsividade por classes nos componentes. Mantida a identidade visual verde/escura.
- `index.html` na raiz é a entrada do Vite; `dist/` contém JS/CSS compilados e não é versionado. `lib/static.cjs` entrega somente o HTML, favicon e assets permitidos do build; fontes, bancos e segredos permanecem inacessíveis. `server.js` alterado somente na entrega de arquivos estáticos. O preview Neon usa esse mesmo helper.
- Projeto organizado como **npm workspaces**: raiz e `vercel/`, com `package-lock.json` único na raiz. Dependências fixadas: React/React DOM **19.3.1**, Tailwind e plugin Vite **4.3.5**, Vite **8.3.6**, plugin React **6.2.1**. Driver Neon e PGlite mantidos no workspace.
- `scripts/dev.mjs` inicia API SQLite e Vite no mesmo processo; o proxy `/api` acompanha `PORT`. Front-end tem atualização pelo Vite; alterações no backend exigem reiniciar esse comando. Não é necessário iniciar dois terminais para desenvolver a interface.
- Na Vercel, a configuração passou à **raiz do repositório**: `vercel.json`, Framework Vite, saída `dist` e entrada `api/index.mjs` reexportando a função Neon. A configuração antiga de Root Directory `vercel/` foi removida e não deve ser usada. Não há publicação realizada nesta sessão.

### Execução e documentação

- Instalar na raiz com `npm ci`.
- `npm start` executa o build antes de iniciar Node/SQLite em 3000.
- `npm run dev` abre Vite em 5173, com proxy para a API local.
- `npm run test:all` compila e roda as duas suítes.
- `npm run db:init:neon` e `npm run preview:neon` operam no workspace Neon; preview depende do build já feito.
- Atualizados `AGENTS.md`, `README.md`, documentos 00/01/02/03/05 e `vercel/README.md`, inclusive a explicação para a professora sobre componentes, estado, hooks, Tailwind e build. As entradas históricas anteriores foram preservadas.

### Verificações executadas e resultados

1. Instalação e build reais. npm foi invocado pelo runtime disponível (`pnpm dlx npm@11.6.2`) por ausência de npm no PATH. Uma tentativa de `npm ci` com Vite aberto encontrou `EPERM` no binário Lightning CSS em uso no Windows. Encerrado o Vite e repetido o comando: **instalação reproduzível passou**, 38 pacotes instalados. Não se alterou código para contornar o bloqueio de arquivo.
2. `npm run test:all`, executado com esse npm: **passou**. O pretest compilou o front-end com Vite, gerando HTML e assets JS/CSS; os testes foram executados em seguida.
3. Suíte local: **13 passaram, 0 falhas**. Mantidos os 10 testes de integração SQLite, adaptando a verificação de assets para ler o HTML do build React e buscar os arquivos com hash. Acrescentados 3 testes da conversão/formatação de duração (limites, valores inválidos e total 07:25).
4. Suíte PostgreSQL/PGlite: **10 passaram, 0 falhas**. CRUD, catálogo de constraints, JOIN/agregações, ordem, rollback após erro real, cascatas, persistência, erros e smoke por HTTP local continuaram passando. A antiga comparação entre duas cópias de frontend foi removida, pois agora ambos entregam o mesmo build físico.
5. `node vercel/scripts/check.mjs`: passou, verificando sintaxe, build existente e configuração básica na raiz. Continua sem equivaler a build/deploy real na Vercel.
6. Navegador com build de produção e backend SQLite em **3006**, banco temporário `C:/Users/siltu/AppData/Local/Temp/setlist-react-5852d401-a7f1-459b-b577-0630d06668b4.sqlite`: duração 00:00 recusada no formulário; criada React A com 03:20 e editada para `React A editada` com 04:10; criada React B com 03:15; criada setlist `Show React`, evento Campus; adicionadas as duas faixas; B movida para cima; nome alterado para `Show React validado`; recarregamento preservou sequência B → A e total **07:25**.
7. Na mesma interface React: removido o vínculo de A, que continuou na biblioteca; testada busca; aberto/cancelado/reaberto diálogo e confirmada exclusão de B (que estava na setlist); repertório ficou vazio. A foi incluída novamente e a setlist foi excluída com confirmação; A continuou na biblioteca após recarregar. Consulta direta SQLite confirmou **1 música, 0 setlists, 0 vínculos**, com `foreign_key_check=[]`.
8. O processo da API em 3006 foi encerrado e reiniciado com o mesmo arquivo; React recuperou a música remanescente com título/duração corretos. Dados da demonstração principal não foram utilizados nesses testes.
9. Layout inspecionado no navegador em **390×844** e **1366×900**, incluindo biblioteca, busca e diálogo de exclusão. Sem transbordamento horizontal do documento nas dimensões conferidas. Console retornou **nenhum erro/aviso** durante as inspeções.
10. `node scripts/dev.mjs` executado com outro banco descartável e API em **3007**: Vite respondeu em **5173**, a interface React carregou os 5 exemplos e o repertório inicial pelo proxy, sem erros/avisos observados no console. O processo foi encerrado antes da reinstalação de dependências.
11. Captura final salva em `C:/Users/siltu/.codex/visualizations/2026/11/01/01a19551-2619-7be3-8db5-f722e225d807/setlist-react-tailwind.jpg`.

**Limites:** não foram validados Neon remoto, deploy/routing reais da Vercel, múltiplos usuários, outros navegadores ou auditoria completa de acessibilidade. A aplicação foi reformulada e conferida localmente; publicação continua pendente de conta/banco/variáveis e teste na URL real. O roteiro de apresentação precisa ser ensaiado novamente porque a explicação do frontend mudou.

**Status:** front-end convertido para React/Tailwind nas duas versões por uma fonte única; build, instalação e 23 testes automatizados aprovados, com fluxos locais confirmados no navegador. Requisitos SQL e integração preservados. Instâncias descartáveis encerradas ao terminar.

## 2026-11-14 — Acabamento visual, letras/cifras e modo de ensaio

**Autorização e meta:** o usuário atualizou o prazo para o fim de novembro e pediu um site clean, com transições/hovers discretos e recursos úteis para músicos. Confirmou busca externa de letras com revisão antes de salvar. A meta permanece ativa; `docs/06_EVOLUCAO_E_QUALIDADE.md` registra critérios, decisões e plano até 30/11. O usuário informou que ainda não tem URL na Vercel. As datas anteriores de 16/11 no histórico e no enunciado original não são o prazo vigente.

**Estado anterior conferido:** árvore limpa na `main`, versão React/Tailwind já enviada no commit `66130b1`. Relidos AGENTS, README, documentos 00–05 e inspecionados os componentes, hook, APIs, schemas e testes reais. Músicas tinham somente dados básicos; não havia material ou leitor de ensaio. Nenhuma dependência npm foi adicionada nesta evolução.

**Implementação e arquivos:**

- `src/styles.css`, `Button.jsx`, `Dialog.jsx`, `App.jsx`, `Library.jsx`, `Setlists.jsx`: movimentos de entrada de 180–240 ms, hover discreto de botões/cards/linhas, foco de textarea e regra de movimento reduzido. Identidade visual e navegação preservadas. Biblioteca identifica material e filtra músicas com letra/cifra; títulos abrem leitura.
- `EditorDialog.jsx` e novo `LyricsSearch.jsx`: dados básicos/tom/notas e seção letra/cifra; busca explícita por título/artista; versões com álbum/duração; prévia; importação para o formulário e gravação somente ao salvar. Cancelar não grava. Formulário valida os dados básicos mesmo se a seção de material estiver selecionada. Cifras são manuais.
- Novo `Rehearsal.jsx`: leitura de cifra monoespaçada com espaços preservados ou letra com quebra de linha; tom/notas; início acumulado de cada faixa; navegação por botões e ←/→; fonte de 14 a 30 px e rolagem opcional. Inicialmente mostra cifra se disponível, senão letra. Leitura é estado de sessão React, sem regravar dados.
- Novos `lib/song-material.cjs` e `lib/lyrics.cjs`: validação compartilhada e consulta LRCLIB por host fixo, identificação SETLIST, query codificada, timeout de 10 s, sem redirecionamento, até 8 opções e respeito a Retry-After. Erros externos não alteram dados. Não há scraping, busca de cifras ou envio de notas/conteúdo do banco ao catálogo.
- `server.js`, `database/schema.sql`, `vercel/lib/handler.mjs`, `vercel/database/schema.sql`, `vercel/api/index.mjs`: novos campos opcionais na música (`letra`, `cifra`, `tom`, `notas`, `letra_fonte`); INSERT/UPDATE parametrizados; PUT antigo preserva campos omitidos e string vazia limpa. Limite JSON de 256 KB comporta material; textos têm limites próprios. A busca `/api/letras` independe de transação/conexão de banco. Entrada Neon mantém handler entre requisições da mesma instância para preservar intervalo local do catálogo.
- SQLite: migração aditiva de colunas ausentes, transacional ao iniciar. PostgreSQL: reaplicar schema com ADD COLUMN IF NOT EXISTS. Não são recriadas entidades ou alteradas relações; permanecem as três tabelas, PK/FK, UNIQUE, cascatas, JOIN e agregações. Orientações de backup e migração remota atualizadas.
- `tests/material.test.js`, `tests/lyrics.test.js`, testes existentes SQLite e PGlite: migração de banco anterior, material, compatibilidade com payload antigo, limites/fonte inválida, integração da busca com os dois handlers, catálogo vazio/falhas/429 e nova dimensão de payload.
- Atualizados AGENTS, README, documentos 00/01/02/03/05 e README Neon; criado documento 06. Entradas históricas anteriores preservadas.

**Testes efetivamente executados:**

1. `npm run test:all`: **17 testes locais + 11 PostgreSQL/PGlite passaram, 0 falhas** na execução final. O comando compila o React antes. CRUD, relações, ordem, JOIN, COUNT/SUM, rollback SQL real, cascatas e persistência continuam aprovados. A primeira tentativa restrita falhou por `connect EACCES` no HTTP de loopback; reexecutada com acesso local permitido, sem alterar código para contornar o ambiente.
2. Migração SQLite: fixture do schema anterior com música ID 7, setlist ID 4 e vínculo preexistente; colunas adicionadas, material gravado e recuperado após fechar/reabrir, IDs/posição conservados, `integrity_check=ok`, `foreign_key_check=[]`. Payloads antigos preservam material; inválidos são recusados e campos podem ser limpos. Tudo em banco temporário.
3. Migração PostgreSQL/PGlite: tabela antiga com registro anterior; schema aplicado duas vezes sem perder o ID/título, campos novos com default vazio. Testes do handler confirmaram criação, edição, limpeza e persistência do material após reabrir o motor. Não é teste de Neon remoto.
4. Busca com respostas injetadas: validação/codificação, fonte, filtragem de registros sem letra, vazio, resposta inválida, falha HTTP/rede e 429; segunda chamada durante Retry-After não chega ao serviço. Rota SQLite por HTTP e handler Neon retornam opções sem gravar músicas; conexão de banco não é aberta pelo handler Neon nesse fluxo.
5. Consulta **real** com `createLyricsSearch` ao LRCLIB para Tempo Perdido/Legião Urbana: 8 opções; primeira com 763 caracteres e fonte de registro 3023239. Não foi usada resposta simulada nessa consulta. Só metadados/quantidade foram registrados no terminal.
6. `node vercel/scripts/check.mjs`: passou (build, sintaxe e configuração básica). `git -c core.autocrlf=false diff --check`: passou. Sem deploy executado.

**Verificação efetiva no navegador:**

Instância em `http://localhost:3012`, banco separado `C:/Users/siltu/AppData/Local/Temp/setlist-polish-20261114.sqlite`, sem exemplos. O banco principal `dados/setlist.sqlite` não foi usado para testes/migração.

- Criada música própria Ensaio de novembro, 04:10, tom Am, notas e letra/cifra com espaços e quebras de linha; material salvo pela interface.
- Criada Tempo Perdido/Legião Urbana, 05:00; busca real pela interface retornou versões; prévia selecionada com textarea ainda vazio (0 caracteres); importação preencheu 763 caracteres; salvar e recarregar/editar recuperou os 763 e a fonte LRCLIB. A letra real ficou somente no banco descartável, não no código ou nas capturas de entrega.
- Criado Acústico de novembro, evento Ensaio geral · sala 02, e incluídas as duas músicas. Mover Tempo Perdido para cima e recarregar preservou a ordem e o total **09:10**. Leitor mostrou a música própria em segundo lugar, com início em **05:00**.
- Leitura de cifra conservou alinhamento (`white-space: pre`); aumentar fonte exibiu 22 px; alternar para letra, avançar, navegar de volta com ← e iniciar rolagem funcionaram. Na letra longa, scrollTop avançou; Escape fechou o leitor. A abertura de faixa sem cifra passou a exibir sua letra por padrão, conferida após o build final.
- Editada cifra para um texto diferente e cancelado: reabrir o leitor conservou a cifra original. Salvar música vazia pela seção de material devolveu mensagem de título/artista e voltou aos dados básicos. Filtros Com cifra/Com letra retornaram respectivamente 1 e 2 músicas.
- Conferidos biblioteca, formulário e leitor em **390×844**, e repertório/leitor em **1366×900**. Largura do documento não excedeu a viewport nas verificações. CSS compilado retornou transições de 160/180 ms e entrada de 240 ms; regra de movimento reduzido presente. Não foi emulada a preferência do sistema operacional nem realizada auditoria completa de acessibilidade.
- Console do navegador: nenhum erro/aviso nas inspeções finais. Capturas com texto próprio em `setlist-novembro-repertorio.jpg` e `setlist-novembro-ensaio.jpg`, na pasta de visualizações do chat. Viewport restaurada e aba temporária fechada.
- Leitura direta final do SQLite confirmou duas músicas com os tamanhos esperados de material, vínculos na ordem 2 → 1, `integrity_check=ok` e FKs sem violações. Instância de teste encerrada por interrupção da sessão de execução (resultado terminal observado).

**Limites e próximo passo:** nenhuma migração foi aplicada ao Neon real e nenhuma publicação foi realizada. Não há URL fornecida ou credenciais locais para validar a infraestrutura remota; as ferramentas disponíveis não incluem acesso Neon/Vercel. A proteção do catálogo é por processo, sem coordenação global entre instâncias serverless. Cobertura de letras depende do catálogo; preenchimento manual permanece disponível. Sem testes de carga/múltiplos usuários ou de outros navegadores. A revisão visual do usuário e a preparação/publicação na Vercel permanecem próximas etapas da meta; esta evolução está implementada e validada localmente. Alterações ainda locais, sem novo commit/push nesta etapa.

## 2026-11-14 — Primeiro diagnóstico da URL Vercel e correção de estado indisponível

**Informação nova:** o usuário forneceu `https://carol-work.vercel.app/`. Isso substitui a ausência de URL do registro anterior; não demonstra que o banco esteja configurado ou que a versão local mais recente tenha sido publicada.

**Evidências executadas no endereço real:**

- GET `/`: HTTP 200, HTML SETLIST e assets públicos respondendo. GET `/api/musicas` e `/api/setlists`: **HTTP 503**, JSON com `Serviço indisponível. Confira a configuração do banco no servidor.`
- Navegador confirmou página renderizada, erro visível e totais/estados vazios exibidos como zero apesar de a consulta ter falhado. Captura em `vercel-diagnostico.jpg`, na pasta de visualizações do chat.
- Asset público `/assets/index-DOmUJh_-.js`: HTTP 200; não contém os recursos Modo de ensaio/Buscar letra presentes no código local. Não foi identificado o commit do deployment pelo painel; não presumir o SHA remoto a partir do hash do asset.
- A mensagem retornada é compatível com falha na obtenção da configuração `DATABASE_URL` na entrada da API anterior. **Inferência, não confirmação do painel:** variável ausente/inválida deve ser a primeira verificação. Não há evidência suficiente para afirmar banco vazio, schema ausente ou credenciais erradas especificamente.
- O painel Vercel redirecionou para login. Nenhuma integração Neon/Vercel de conta está disponível entre as ferramentas. A ferramenta WebMCP pública “Open Vercel Plugin” apenas abriu uma página de documentação do plugin; não autenticou nem concedeu acesso ao projeto. Não foram lidos logs privados, variáveis, senhas ou tabelas remotas.
- **Não foram executados CRUD/mutações online**, smoke remoto, migração ou redeploy. Sem banco respondendo, não declarar persistência/JOIN/agregação online aprovados.

**Problema comprovado e correção local:** falha na primeira carga era apresentada junto com contadores zero e biblioteca vazia, permitindo tentar cadastros sem carga inicial válida. Em `src/hooks/useSetlistData.js`, `hasLoaded` só passa a verdadeiro após leitura completa bem-sucedida. Em `src/App.jsx`, a primeira falha exibe totais `—`, estado indisponível e criação bloqueada; “Tentar novamente” permanece habilitado. Uma biblioteca de fato carregada e vazia continua mostrando zero e ações de cadastro. Sem mudanças nos bancos/SQL.

**Teste de navegador da correção:** servidor local temporário em 3013, sem banco, simula as duas primeiras consultas GET com 503 e as seguintes com arrays vazios 200. Confirmados: criação bloqueada, retry habilitado, nenhum falso “Um palco em branco”; ao clicar em retry, erro some, contadores passam para zero e criação volta a estar disponível. É teste de UI com respostas controladas, **não teste de recuperação do Neon remoto**. Captura do estado corrigido em `setlist-falha-corrigida.jpg`. Servidor temporário encerrado por interrupção da sessão.

**Regressão executada:** `npm run test:all` recompilou a interface e aprovou **17 testes locais e 11 PostgreSQL/PGlite**, sem falhas. Os testes do navegador complementam a suíte para o estado de erro do React.

**Próximo passo:** confirmar/criar conexão Neon no projeto, confirmar `DATABASE_URL` no ambiente Production, aplicar o schema PostgreSQL atual e redeploy. A pergunta sobre o estado da conexão foi enviada ao usuário; nunca solicitar senha/token no chat. Versão local e alterações novas continuam sem novo commit/push; a falha observada no deployment permanece sem correção remota confirmada. Meta ativa.

## 2026-11-14 — Confirmação da pendência Neon e revisão de teclado

**Informação nova:** o usuário confirmou “Ainda não conectei o Neon”. O banco remoto deve ser criado/conectado ao projeto antes da validação online. A consulta ao diretório de integrações confirmou Vercel e Neon disponíveis, mas não instalados/conectados nesta conversa; ambos foram sugeridos. Consulta posterior às ferramentas não encontrou acesso de conta Vercel/Neon. Nenhum deploy, variável ou banco remoto foi modificado.

**Problema reproduzido:** ao abrir Nova setlist e Nova música, o foco permanecia em “Fechar formulário”, apesar da intenção de autoFocus no primeiro input. Inspeção mostrou que React não deixou atributo autofocus no HTML e tentou focar antes de o dialog ser aberto. O overflow da página de fundo permanecia visible com o diálogo aberto.

**Correção:** `EditorDialog.jsx` marca o primeiro campo com data-autofocus; `Dialog.jsx` aplica foco depois de showModal. `Button.jsx` marca botões autoFocus, preservando a intenção de foco em Cancelar nas confirmações. O botão de fechar aceita rótulo apropriado: Sair do ensaio no leitor e Fechar formulário no editor. `src/styles.css` bloqueia a rolagem do documento com diálogo aberto e reserva o espaço da barra para evitar deslocamento horizontal. Não houve alteração de API/SQL/schema nesta revisão.

**Verificação realmente executada:**

- `npm run build`: passou, com os componentes atuais compilados. `node vercel/scripts/check.mjs` e `git -c core.autocrlf=false diff --check`: passaram.
- Navegador em instância descartável na porta 3014, SQLite em memória com dados fictícios e letra autoral de 80 linhas. Nova setlist abriu com input nome focado; Escape fechou e retornou ao botão de origem. Nova música abriu com input titulo focado; Tab levou a artista. Confirmação de exclusão iniciou com Cancelar focado e foi cancelada, sem excluir dados.
- Overflow do documento passou a hidden enquanto o diálogo estava aberto e voltou ao estado anterior após fechar. Largura do documento não excedeu a viewport na inspeção.
- Rolagem do ensaio iniciou e avançou; Pausar voltou a aria-pressed=false. A posição permaneceu em 279 px após outras interações, confirmando pausa. Aumentar/diminuir fonte retornou a 20 px. Sair do ensaio fechou o leitor.
- Console sem erros/avisos nas inspeções finais. Captura do foco corrigido em `setlist-foco-formulario.jpg`, na pasta de visualizações do chat. Aba fechada e processo de teste encerrado com resultado terminal observado.
- A suíte completa de 28 testes passou no ciclo imediatamente anterior; não foi repetida nesta revisão exclusiva de foco/CSS. Os controles alterados foram exercitados no navegador após o novo build.

**Próximo passo externo:** conectar as contas nas integrações ou criar/conectar Neon pelo painel autenticado da Vercel. O guia oficial confirma que a integração gerenciada pode criar conta/projeto Neon e configurar DATABASE_URL no projeto conectado. Depois aplicar o schema, publicar os arquivos novos e executar os testes na URL real. Referência: https://neon.com/docs/guides/vercel-managed-integration. Esta pendência impede declarar o site online concluído; meta permanece ativa.

## 2026-11-14 — Bloqueio da etapa online revalidado

**Auditoria de continuidade:** o ciclo anterior teve progresso verificável de interface (foco/diálogos e pausa da leitura). O impedimento externo da publicação/validação online persistiu no diagnóstico da URL, na tentativa de conexão das contas e nesta revalidação: não há banco Neon conectado pelo usuário nem acesso autenticado disponível para configurar o projeto.

**Estado revalidado:** nova consulta ao diretório de integrações retornou Vercel e Neon como não instalados; nenhuma ferramenta dessas contas está disponível. Novos GETs públicos a `/api/musicas` e `/api/setlists` em `https://carol-work.vercel.app` retornaram novamente HTTP 503 e a mesma mensagem de configuração do banco. O usuário já confirmou que ainda não conectou o Neon. Não há processo/deploy em andamento pelo agente a aguardar; instâncias locais de teste foram encerradas.

**Decisão:** após o impedimento se repetir por três ciclos consecutivos e a implementação/verificação local já ter sido realizada, marcar a meta como **bloqueada**, sem alterar o objetivo ou declará-lo concluído. O avanço restante exige autenticação/conexão do banco pelo usuário ou conexão das integrações de conta. Não repetir testes ou acrescentar funcionalidades para contornar a ausência de acesso remoto. Nenhum arquivo de código, banco, commit ou deployment foi modificado neste ciclo; esta entrada apenas registra o estado.

**Retomada:** confirmar acesso autenticado, criar/conectar Neon ao projeto `carol-work` em Production, aplicar o schema PostgreSQL atual, publicar as mudanças locais e executar CRUD/persistência/letras/ensaio na URL real. Não solicitar nem versionar senhas/tokens. Testes locais aprovados não substituem essa validação remota.

## 2026-11-14 — Configuração oficial do Neon para o agente

**Solicitação:** seguir `https://neon.com/prompts/agent-setup.md` e depois a skill `https://neon.com/.well-known/agent-skills/neon/SKILL.md`; verificar instalações existentes, instalar somente o que faltava e preservar a configuração. O usuário confirmou login na conta correta por GitHub.

**Inspeção anterior:** Node 24.22.1/npm 11.19.1 já instalados; Neon CLI ausente. Nenhuma skill Neon nos diretórios locais/globais inspecionados, nenhum registro Neon no config.toml do Codex e nenhum plugin Neon instalado na listagem do Codex. A configuração existente continha outros plugins e MCPs, que deveriam permanecer.

**Alterações executadas:**

1. `npm install -g neon@latest` instalou **Neon CLI 9.5.0** no prefixo npm do usuário (`C:/Users/siltu/AppData/Roaming/npm`). O package.json/lockfile do SETLIST não foram alterados. npm avisou sobre postinstall de esbuild não autorizado por sua política de scripts; versão, comandos de ajuda e instalação do plugin funcionaram sem mudar essa política.
2. `neon login`, iniciado pelo agente, abriu a autenticação oficial. O CLI confirmou `Auth complete (profile DEFAULT)`; o usuário confirmou ser a conta desejada e informou login com GitHub. Credenciais ficaram no armazenamento do CLI, fora do projeto e do histórico. Nenhuma senha/token foi solicitado ou impresso pelo agente.
3. Antes da instalação, salvo backup do config.toml em `backups/neon-agent-setup-20261114/config.toml.before`, pasta ignorada pelo Git. Criado manifesto de SHA-256 dos 59 arquivos existentes versionados/não ignorados para detectar alterações do instalador.
4. `neon plugins --agent codex -y` instalou em escopo de usuário o plugin oficial **neon-postgres 3.0.8**, registrado como `neon-postgres@plugins-cli`. O comando usa o escopo global de usuário por padrão, conforme a ajuda real do CLI. Acrescentada a entrada habilitada no `C:/Users/siltu/.codex/config.toml`; o conteúdo anterior permaneceu integralmente como prefixo do arquivo final.
5. Plugin em `C:/Users/siltu/.codex/plugins/cache/plugins-cli/neon-postgres/3.0.8`. Verificados os sete SKILL.md: neon, neon-postgres, neon-auth, neon-object-storage, neon-functions, neon-ai-gateway e neon-realtime. O manifesto Codex aponta para `./skills/`; `mcp.json` inclui servidor HTTP `neon` em `https://mcp.neon.tech/mcp`, sem chave embutida. O SETLIST usará essa instalação global, sem duplicação de configuração MCP no repositório.

**Verificações:** CLI `--version` retornou 9.5.0; perfil DEFAULT autenticado; `codex plugin list --json` confirmou nome/versão/installed/enabled; arquivos reais de skills e manifesto MCP inspecionados. Consulta autenticada `neon orgs list -o json` passou e retornou uma organização; saída resumida sem detalhes privados. Uma primeira tentativa de listar projetos exigiu seleção de organização e não serviu como prova de acesso à API; a verificação foi refeita com a listagem de organizações, sem criar recursos. SHA-256 confirmou **zero arquivos do projeto alterados pelo instalador**, e comparação confirmou preservação integral da configuração Codex anterior. Backup confirmado como ignorado pelo Git. Não foram repetidos testes do aplicativo, pois o setup não mudou seu comportamento.

**Limites/retomada:** é necessário reiniciar/reabrir o Codex para carregar o plugin, as skills e o MCP. O MCP pode solicitar seu próprio consentimento OAuth no primeiro uso; a instalação do manifesto não comprova transporte MCP autenticado nesta sessão. O CLI já está autenticado e pode ser usado sem esperar esse carregamento. Nenhum banco/branch foi criado, nenhum projeto Neon foi vinculado ao SETLIST, nenhuma DATABASE_URL do aplicativo foi escrita e nenhuma configuração da Vercel foi alterada neste pedido. A etapa de provisionar/conectar o banco, aplicar o schema e publicar continua pendente. Instalação das ferramentas concluída; configuração do banco do aplicativo permanece distinta.

## 2026-11-14 — Banco Neon separado criado e preparação da publicação

**Retomada e autorização:** após reiniciar o Codex, o usuário retomou a meta e escolheu explicitamente criar um projeto SETLIST separado. O projeto anterior `purple-frog-13620404` foi preservado. As skills Neon carregaram, mas ferramentas MCP não apareceram; utilizado o CLI autenticado, conforme preferência da skill. O executável CLI e dependências npm não estavam presentes após o reinício. A reinstalação inicial encontrou ENOENT num conteúdo ausente do cache npm. Repetida com cache separado ignorado em `backups/neon-npm-cache`: CLI 9.5.0 restaurado e login GitHub DEFAULT preservado; `npm ci` restaurou as dependências já fixadas no lockfile, sem mudança de versões.

**Infraestrutura Neon:** criado projeto **SETLIST**, ID `cold-frost-08199078`, região `aws-us-east-2`, PostgreSQL 18 e compute 0.25 CU; branch principal `main`, ID `br-sparkling-cell-be4lbvbo`. Branch temporário `setlist-validation-20261114`, ID `br-rapid-mouse-benb9wxa`, criado com expiração de 24 horas para validar antes do principal.

**Verificação real no Neon:** conexão WebSocket do driver existente funcionou. Branch de teste vazio inspecionado antes de qualquer DDL. `vercel/database/schema.sql` aplicado duas vezes pela conexão direta; catálogo confirmou três PKs e duas FKs com cascata. Preview HTTP local usando conexões reais ao branch executou o smoke completo: CRUD de músicas/repertórios, letra/cifra/tom/notas, compatibilidade de PUT sem material, duplicidade, ordem B→A, JOIN, COUNT/SUM com 2 músicas/445 segundos, remoção de vínculo, cascatas e leitura por requisições separadas. **Passou**, com limpeza somente dos IDs do teste e biblioteca do branch novamente vazia. Isso valida transporte real Neon/WebSocket; não é PGlite nem simulação de respostas.

**Banco principal:** após o teste, confirmado vazio e aplicado o mesmo schema pela conexão direta. Três tabelas ficaram vazias, prontas para o uso. `.neon` vincula a pasta ao novo projeto/main, sem env pull automático; arquivo ignorado pelo Git. Criado `vercel/.env.local`, também ignorado, com DATABASE_URL pooled para o aplicativo e DATABASE_URL_UNPOOLED para migração. Conexões obtidas em memória sem imprimi-las. Nenhuma gravação no SQLite principal.

**Ajustes do código/verificação:** `getDatabase` aceita conexão opcional; `init-db.mjs` prefere DATABASE_URL_UNPOOLED e mantém fallback compatível. Exemplo de env documenta o campo direto. O smoke agora verifica material musical salvo e retornado pelo JOIN. `npm run db:init:neon` passou contra o banco principal, reaplicando o schema idempotente e confirmando FKs. `npm run test:all`: **17 locais + 11 PGlite passaram, 0 falhas**, após os ajustes. Uma tentativa inicial do helper de teste não resolveu o driver a partir de `backups/`; corrigida para resolver pelo workspace `vercel/`, sem trocar/adicionar driver.

**Acesso/configuração Vercel:** CLI oficial 65.16.0 carregado temporariamente via npm exec. O usuário concluiu e confirmou login como cuidoka. Pasta vinculada ao projeto existente `carol-work` (`prj_VF0K7kCtV72z6AEFWo3qBRCAvCIJ`), dono `cuidokas-projects`, já conectado ao GitHub `Cuidoka/carol-work`, branch `main`. O link criou `.vercel/project.json` e `.env.local` com OIDC; ambos ignorados, sem expor valores. Normalizadas as entradas duplicadas de ignore adicionadas pelo CLI, mantendo as exceções de exemplos.

**Causa confirmada do 503 anterior:** a listagem de variáveis revelou DATABASE_URL_DATABASE_URL e outras variáveis prefixadas, mas não DATABASE_URL. A entrada da API exige exatamente DATABASE_URL. Adicionado esse nome correto como **Secret apenas em Production**, apontando para o novo projeto SETLIST; variáveis/integração antigas preservadas. Ajustados somente os parâmetros de build necessários: Node 26.x → **24.x**, framework Node → **Vite**, install `npm ci`, build `npm run build`, saída `dist`. Root Directory já era a raiz e foi preservado. Snapshot de configurações anteriores salvo em backup ignorado.

**Proteção da publicação:** `.vercelignore` ampliado para ignorar env em qualquer diretório, `.neon`, `.agents` e `.codex`, além de bancos/backups existentes. Revisão Git confirmou nenhum banco, arquivo de conexão ou contexto `.neon` entre arquivos a publicar. Nenhum segredo em argumentos de linha de comando; o valor DATABASE_URL foi passado por stdin ao CLI Vercel.

**Estado neste registro:** banco/configuração prontos e testes locais/remotos aprovados. A publicação do código novo e a verificação da URL pública ainda serão executadas; não antecipar sua aprovação.

## 2026-11-14 — Publicação e validação final na Vercel/Neon

**Publicação:** commit **f02fa75** (`feat: adicionar letras, cifras e ensaio com Neon`) enviado à main de Cuidoka/carol-work. O GitHub acionou deployment **dpl_JAV6wgBPPr4e77scM44KEEkjWafa**, URL técnica `carol-work-4blpzfhmd-cuidokas-projects.vercel.app`; a API Vercel confirmou **READY** e SHA correspondente. Endereço público: **https://carol-work.vercel.app/**. O banco conectado é o projeto Neon novo escolhido pelo usuário; projeto antigo e SQLite local preservados.

**Testes públicos executados:**

- GET `/`: HTTP 200, build novo. GET `/api/musicas`: HTTP 200, sem erro de configuração. O 503 anterior está resolvido.
- `npm run smoke --workspace setlist-vercel -- https://carol-work.vercel.app`: **passou**. Criou seus próprios IDs e validou cadastro/leitura/edição/exclusão de músicas e repertórios, letras/cifras/tom/notas persistidos, compatibilidade de edição sem apagar material, vínculo N:N, rejeição de duplicata, ordem, JOIN, COUNT/SUM (2/445), remoção de vínculo, cascatas e leitura entre requisições. Limpou somente seus registros.
- GET `/api/letras` pela função publicada para Tempo Perdido/Legião Urbana: HTTP 200, 8 opções; primeira com 763 caracteres. Busca real ao LRCLIB a partir da Vercel, sem mock.
- GETs `/.env.local`, `/vercel/.env.local`, `/.neon` e `/database/schema.sql`: **404**, sem conexão PostgreSQL exposta.

**Navegador no endereço público, sem simulação de API:**

1. Criadas Validação visual A (04:10, artista Teste descartável SETLIST, Am, notas e letra/cifra autorais) e B (03:15). Criado Ensaio de validação online, com evento identificando teste, e adicionadas as duas faixas.
2. B movida para cima. Após recarregar: ordem **B → A**, total **07:25** e material de A preservado. Leitor de A mostrou faixa 2/2 com início em **03:15**, tom, cifra alinhada e notas. Alternância para letra e aumento para 22 px funcionaram.
3. Nova música de busca: título/artista reais usados só no formulário, sem gravar a faixa. Oito versões retornaram. Selecionada prévia com textarea ainda em 0 caracteres; Usar esta letra preencheu 763; Cancelar fechou sem criar registro. Letras reais não foram incluídas no código/capturas ou persistidas no banco principal.
4. Filtro Com cifra retornou somente A. Conferidos layout do leitor/formulário/biblioteca em **390×844** e repertório/leitor em **1366×900**, sem transbordamento horizontal do documento. Hover real do card confirmado: `:hover=true`, deslocamento `translateY(-2px)` e sombra discreta; transições computadas de 160/180 ms. Console sem erros/avisos nas inspeções finais.
5. Capturas `setlist-online-repertorio.jpg` e `setlist-online-neon.jpg` na pasta de visualizações do chat, com texto autoral e dados de teste identificados. Viewport temporária restaurada.
6. Limpeza por API somente dos IDs da interface: músicas **3/4** e setlist **2**, conferindo título/artista/evento antes de excluir e preservando quaisquer registros alheios. Após a limpeza, GETs retornaram biblioteca/repertórios vazios. Consulta direta de leitura ao Neon principal confirmou **0 músicas, 0 setlists, 0 vínculos, 3 PKs e 2 FKs com cascata**.
7. Removido somente o branch descartável `br-rapid-mouse-benb9wxa`, após validar ID/nome e que não era principal. `main` preservado. Página pública recarregada após limpeza: sem alerta, criação habilitada; aba marcada como entrega para o usuário.

**Auditoria de conclusão da meta:** transições/hovers clean, material musical editável, busca com revisão, filtros e modo de ensaio estão implementados e demonstrados; estrutura acadêmica e SQLite preservados. Regressão final: **28 testes locais/PGlite aprovados**, complementados por teste de transporte Neon real, smoke público e navegador público. Documentos atuais atualizados para não manter o diagnóstico 503 como estado vigente. Credenciais, arquivos de contexto e bancos continuam fora do Git/deploy estático.

**Limites reais:** não foram realizados teste de carga, auditoria integral WCAG, outros navegadores ou teste de usuários simultâneos. Movimento reduzido foi conferido no CSS compilado, sem emular a preferência do SO. Exclusões online foram exercitadas via API; a interface de exclusão foi validada localmente nos ciclos anteriores. O app conserva o escopo acadêmico sem contas de usuário e compartilha o mesmo banco entre visitantes. A meta de software deste ciclo foi atendida; ensaio oral e futuras melhorias são atividades posteriores.

## 2026-11-14 — Cifras prontas e duração de catálogo

**Pedido posterior:** pesquisar métodos realmente funcionais para trazer cifras prontas, principalmente Cifra Club, letras e duração de músicas conhecidas. A pessoa não deve precisar escrever os acordes. Preservar entrada manual para composições autorais. Esse pedido amplia o escopo anterior que limitava cifras à edição manual; não autoriza gerar acordes fictícios nem substituir o CRUD acadêmico.

**Pesquisa e limites:** não encontrada API pública documentada Cifra Club/Letras. Requisições Node às páginas receberam 403; Cifras.com.br/E-Chords receberam desafio Cloudflare/403; documentação Vagalume ficou 503. No navegador normal, busca/página Cifra Club e busca Letras funcionaram. Botão Baixar cifra não gerou download observado, portanto não foi considerado método aprovado. Não implementado proxy, contorno de bloqueio, captura de área paga ou API privada. Apple/iTunes e MusicBrainz retornaram metadados reais por API pública; a segunda também apresentou 503 numa tentativa, tratado corretamente. Pesquisa detalhada e referências no novo documento 07.

**Implementação:** `lib/catalog.cjs` compartilha GET `/api/catalogo` entre SQLite e Neon; catálogo inicial iTunes e opção MusicBrainz, duração convertida de milissegundos, fontes, cache limitado, identificação, timeout, intervalo de consultas e Retry-After. `CatalogSearch.jsx` permite escolher a gravação e preencher automaticamente o tempo, sem trocar título/artista. LRCLIB agora preenche duração válida quando vazia; preserva duração já informada. Autorais continuam com entrada manual.

`ChartImport.jsx` e `src/lib/import-song.mjs` importam cifra pronta colada ou TXT/HTML, com prévia e confirmação antes de preencher o editor. Preservam acordes/espaços e rejeitam vazio, binário e excesso. HTML só é analisado em template desconectado; scripts/iframes removidos, nunca inserido como HTML da aplicação. Fonte e possível título/artista do arquivo são aproveitados sem substituir identificação digitada. Links de busca Cifra Club/Letras verificados no navegador; corrigido o hash exigido pela busca Letras. O link sozinho não baixa o conteúdo. Textos da interface e README deixam isso explícito.

**Banco e arquivos:** `cifra_fonte`/`duracao_fonte` TEXT, default vazio, até 500 caracteres, migrações aditivas SQLite/PostgreSQL. Mantidas três tabelas, PK/FK, N:N, dados e SQL parametrizado. PUT antigo preserva fontes; links validados em `lib/music-sources.mjs`, sem fetch arbitrário. Editor/ensaio mostram origem. Alterar duração manualmente limpa sua fonte. Sem dependências npm novas ou alteração do lockfile. Atualizados README e documentos 00/02/05/06/07; novos testes de catálogo/importação e ampliação de material/smoke.

**Verificações executadas até este registro:**

- `npm run build`, sintaxe/configuração Vercel e diff check: passaram. `npm run test:all`: **23 testes locais + 11 PGlite, 0 falhas**. Primeira execução parcial sem escalonamento falhou em conexões HTTP localhost com EACCES do sandbox; execução autorizada posterior passou. Não foi defeito de código.
- Chamadas reais pelo módulo de catálogo: iTunes 12 opções, primeira Tempo Perdido/Legião Urbana, Mais do Mesmo, **302 s**; MusicBrainz 11 opções, primeira álbum Dois, **300 s**. Nenhum áudio/capa importado. Versões diferentes justificam seleção explícita.
- Navegador com SQLite descartável `backups/import-ui.sqlite`, servidor 3015. Escolha iTunes preencheu 05:02. MusicBrainz recebeu indisponibilidade numa consulta da UI: erro apareceu sem apagar o formulário; chamada direta anterior tinha passado. Não declarar essa tentativa da UI como busca MusicBrainz aprovada.
- Cifra pública Cifra Club: `pre` com 4.188 caracteres importado por colagem; prévia com 4.187 após normalização, cifra gravável ainda vazia antes da confirmação e preenchida após Usar esta cifra. Cancelar descartou tudo; biblioteca permaneceu vazia. Conteúdo real não entrou no código, nas capturas ou no Neon principal.
- HTML/TXT de teste com texto autoral importados por file chooser. Prévia manteve acordes, espaços e quebras, retirou script, título da aplicação não mudou e atributo de execução continuou ausente. Metadados do HTML preencheram título/artista vazios. Salvamento criou apenas a faixa autoral de teste; API/refresh/ensaio confirmaram duração 200 s, cifra com 72 caracteres e fonte persistidas. Conteúdo anterior não foi substituído pelo TXT só revisado sem confirmar.
- LRCLIB real no navegador: sete botões de versões compatíveis com o título/artista, prévia com 763 caracteres; antes da confirmação letra tinha zero, depois importou. Duração vazia foi preenchida com **05:02**, fonte LRCLIB. Cancelado sem cadastrar outra faixa. (O serviço retornou oito opções totais; uma tinha artista distinto.)
- Layout 390×844: diálogo clientWidth=scrollWidth=326; documento não transbordou. Console sem erros/avisos na leitura final. Captura autoral `setlist-importacao-cifra.jpg`, viewport restaurada e abas temporárias fechadas. A captura foi feita antes do último ajuste de links; serve como evidência do fluxo testado, não da versão final do link.
- Neon branch normal **br-divine-heart-beojj9qj**, filho de main no projeto SETLIST, criado com expiração e compute 0.25 para validação. Schema aplicado duas vezes e smoke completo com fontes passou. Contagens anteriores preservadas (1 música, 0 repertórios, 0 vínculos). Depois aplicada mesma migração em main pela conexão direta: duas colunas novas presentes e mesmas contagens antes/depois. O registro existente pertence ao usuário e foi preservado. SQLite principal e projeto Neon anterior não alterados.

**Estado neste registro:** testes/migração aprovados; novo commit/deploy e validação pública deste ciclo ainda pendentes. A implementação oferece cifras prontas sem redigitar por importação; busca automática do texto de cifra por URL continua indisponível, e não deve ser anunciada como implementada. APIs externas dependem da cobertura e disponibilidade dos catálogos.

**Falha de publicação comprovada e correção:** commit 29461bf enviado; deployment dpl_BEndKKFEi2senXkwfYwjbXMFTT2t chegou a READY, mas GET público da API respondeu erro de inicialização, antes de executar o smoke. Logs Vercel confirmaram ERR_REQUIRE_ESM em `require('./music-sources.mjs')` chamado por módulo CJS. Node 24 local aceita essa interoperabilidade síncrona; o carregador da Vercel não aceitou. Substituído por `import()` padrão dentro das funções assíncronas; validação de material e os quatro locais de chamada foram ajustados para await. Sem nova alteração de schema. Regressão será executada com `--no-require-module` para reproduzir a restrição, além da verificação pública após publicar a correção. A tentativa pública que falhou não criou/removeu registros.

**Regressão da correção executada:** `node --no-require-module --test` aprovou 23 testes locais e `node --no-require-module --test vercel/checks/integration.mjs` aprovou 11 testes PGlite, sem falhas. O build anterior permanece válido porque a correção afeta somente o carregamento no servidor. Essa evidência reproduz a limitação localmente, mas não substitui a nova consulta à URL pública.

**Publicação corrigida e validação pública concluída:** commit **209522d**, deployment **dpl_Ahoey45enFepV7dghX56mLRKDKk3**, técnico `carol-work-rm3vhlg5u-cuidokas-projects.vercel.app`, confirmado READY com SHA correspondente. Em **https://carol-work.vercel.app/**:

- Smoke completo passou: CRUD, material/fontes persistidos em POST/PUT/JOIN, duplicidade, ordem, COUNT/SUM, remoção de vínculo e cascatas. Limpeza restrita aos próprios IDs. Biblioteca antes/depois comparada integralmente em memória: **a música preexistente foi preservada**.
- GET `/api/catalogo` real pela Vercel: **iTunes HTTP 200 / 12 opções**, primeira 302 s; **MusicBrainz HTTP 200 / 11 opções**, primeira 300 s. GET `/api/letras`: **200 / 8 opções**, primeira com 763 caracteres. Sem simular respostas e sem persistir conteúdo real dessas letras/cifras.
- Navegador público: consulta iTunes mostrou 12 opções e Usar duração preencheu 05:02. Mudada identificação para registro de teste explícito, importado HTML autoral pelo file chooser; prévia e campo de colagem receberam 72 caracteres. Script não executou. Usar esta cifra e Salvar música fecharam o formulário; após reload, biblioteca mostrou a faixa, ensaio mostrou conteúdo alinhado e origem; editor mostrou 05:02 e fonte Apple persistidos.
- Console público sem erros/avisos na inspeção final. Captura da versão publicada `setlist-importacao-online.jpg`, somente com texto autoral. Registro de validação **ID 8** removido por API após conferir título, artista, duração, cifra e fontes; comparação antes/depois confirmou preservação dos demais registros. Restou a única música preexistente do usuário.
- Branch temporário **br-divine-heart-beojj9qj** removido após conferir ID/nome/parent; main e projeto anterior preservados. Servidor local descartável encerrado; abas temporárias fechadas. Nenhuma mudança no SQLite principal.

**Resultado deste ciclo:** cifras prontas podem ser importadas sem redigitar, letras podem ser buscadas e duração pode ser preenchida por três fontes (iTunes/MusicBrainz ou LRCLIB quando vazia). Os requisitos acadêmicos passaram novamente. **Não há API oficial Cifra Club/Letras nem importação automática por URL**; o fluxo exige copiar a cifra ou selecionar arquivo. HTML precisa conter `pre`, em UTF-8; não há PDF/OCR. Catálogos podem não cobrir a faixa, devolver outra gravação ou ficar indisponíveis; o usuário deve revisar. Não foi feito teste de carga, múltiplos navegadores ou usuários simultâneos. O erro inicial de publicação foi corrigido e a validação pública foi refeita com sucesso, sem confundir READY do build com funcionamento da API.

## 2026-11-14 — Abrir cifra diretamente pelo link no ensaio/show

**Pedido:** quando não for possível importar a cifra, salvar o link e abrir a página exata do Cifra Club com um clique durante o ensaio/show.

**Problema comprovado no código:** o input de fonte pertencia ao estado interno de ChartImport. Só era enviado ao editor quando Usar esta cifra confirmava uma importação de texto; preencher apenas a URL e salvar a música perdia o link. No ensaio havia apenas uma referência discreta, condicionada à aba Cifra, e a tela inicial de música sem cifra começava em Letra.

**Alterações:** `ChartImport.jsx` agora recebe o link controlado pelo editor. Campo renomeado para Link da cifra, com instrução explícita de salvar só o link. `EditorDialog.jsx` normaliza/valida e persiste `cifra_fonte` independentemente do conteúdo. Importar texto não limpa o link. `Rehearsal.jsx` oferece botão destacado **Abrir cifra no Cifra Club** (ou fonte correspondente) fora das abas; abre URL salva em nova aba com noopener/noreferrer. Música só com link inicia na aba Cifra e mostra instrução apropriada; importação segue opcional. `Library.jsx` inclui músicas com link válido no filtro Com cifra. Nenhuma mudança de schema/API/dependências; usa o campo existente nos dois bancos.

**Testes realmente executados:**

- `npm run test:all`: build React passou; **23 testes locais + 11 PostgreSQL/PGlite, 0 falhas**. Testes existentes ampliados para fonte com cifra vazia, JOIN e persistência após reiniciar o SQLite. Não foram adicionadas dependências de teste.
- Navegador em instância descartável na porta 3016, SQLite em memória, sem usar dados reais. Cadastrada música com título/artista/05:02 e apenas URL Cifra Club. Sem importar texto. Após reload, editor mostrou mesma URL e cifra com **0 caracteres**; leitor iniciou em Cifra e ofereceu o botão.
- Clique real no botão criou nova aba com título **Tempo Perdido - Legião Urbana - Cifra Club** e URL exata `https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/`. SETLIST manteve seu diálogo de ensaio aberto. Aba externa temporária fechada.
- Filtro Com cifra manteve a música só com link. Formulário rejeitou `javascript:alert(1)` com erro, sem salvar. Importação de texto autoral para o rascunho manteve a URL; cancelamento descartou o texto.
- Criado repertório de teste pela interface, vinculada a faixa e clicado Iniciar ensaio: botão disponível. Alternar para Letra manteve o botão externo visível.
- Em viewport 390×844, diálogo clientWidth=scrollWidth=326, sem transbordamento horizontal. Viewport restaurada. Console sem erros/avisos na inspeção final. Captura `setlist-link-direto.jpg` na pasta de visualizações do chat; aba temporária fechada.

**Limites/estado:** abrir página externa depende da conexão e disponibilidade do site; o ensaio do SETLIST permanece aberto. Não foi feito teste offline nem em outros navegadores. Validação local concluída; publicação deste ajuste ainda será confirmada. README e documento 07 atualizados. Não houve acesso de escrita a bancos reais neste ciclo.

**Publicação e conferência online:** commit **08c9d79** enviado ao GitHub; deployment **dpl_2hQf41GWBCeFsGEobRK8WyZpwhTH**, técnico `carol-work-o929y9v3n-cuidokas-projects.vercel.app`, confirmado **READY** com SHA correspondente. A primeira tentativa de criar o teste online foi interrompida pela revisão automática por limite de créditos, antes de executar qualquer ação; após o usuário pedir continuidade, a nova revisão aprovou a retomada.

Na API pública, criada apenas a música de teste **ID 10**, com `cifra=''` e URL Cifra Club persistida em `cifra_fonte`. Navegador na URL **https://carol-work.vercel.app/** abriu essa música no ensaio e confirmou href exato, target `_blank` e rel `noopener noreferrer`. Clique real criou aba com título **Tempo Perdido - Legião Urbana - Cifra Club** e URL `https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/`; diálogo de ensaio permaneceu aberto. Console sem erros/avisos na inspeção final. Captura `setlist-link-direto-online.jpg`, com identificação explícita de teste e sem letra/cifra reproduzida. Abas temporárias fechadas.

Limpeza pela API apenas do **ID 10**, após conferir título, artista, cifra vazia e URL; comparação integral dos demais registros antes/depois confirmou preservação da **única música preexistente**. Nenhuma migração de banco foi necessária. Ajuste publicado e validado; a dependência externa continua sendo abrir a página do provedor em outra aba, sem baixar ou incorporar seu conteúdo.
