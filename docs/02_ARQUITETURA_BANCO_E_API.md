# SETLIST — Arquitetura técnica, banco de dados e API

**Atualização em 07/11/2026:** o usuário autorizou converter todo o front-end para React + Tailwind + Vite. A interface compartilhada está em `src/`; `index.html` é a entrada e o build gera `dist/`. O servidor local e o preview Neon entregam esse mesmo build. A API e o modelo relacional descritos abaixo continuam válidos. As antigas interfaces `public/app.js`, `public/index.html`, `public/styles.css` e suas cópias em `vercel/public/` foram removidas após a conversão. Consulte o histórico para evidências.

**Versão online:** `vercel/` contém o back-end **Neon/PostgreSQL** e é um workspace npm. A configuração de deploy agora está em `vercel.json` na **raiz**, com entrada em `api/index.mjs`. Root Directory na Vercel deve ser a raiz do repositório, não `vercel/`. O front-end React é compartilhado, mas os schemas e os dados dos dois bancos são separados.

## Extensão de material de ensaio — 14/11/2026

**15/11/2026 — Backup, impressão e proteção de rascunho:** `GET /api/backup` exporta um snapshot JSON versionado dos dados; `POST /api/backup/validar` retorna quantidades sem gravar; `POST /api/backup` valida e adiciona cópias numa transação, retornando quantidades/novos IDs. Restauração preserva N:N e ordem com remapeamento dos IDs; não substitui registros atuais. Até 4 MB apenas nessas rotas POST; demais rotas mantêm 256 KB. Validação e formato compartilhados em `lib/backup.cjs`; sem schema novo. PostgreSQL exporta com REPEATABLE READ READ ONLY; SQLite usa transação. Impressão é um componente React com CSS A4 e window.print; formulário usa confirmação de descarte e beforeunload. Consulte documento 08 e histórico para limites/testes realmente executados.

Extensão posterior no mesmo dia: `cifra_fonte` e `duracao_fonte` (TEXT, default vazio, até 500 caracteres) adicionadas de forma idempotente. Validação por hosts HTTPS permitidos, sem aceitar credenciais; PUT sem esses campos preserva valores. `GET /api/catalogo` consulta metadados/duração em iTunes ou MusicBrainz sem abrir transação no banco. Importação de cifras por colagem/arquivo ocorre no navegador e só persiste ao salvar a música. Detalhes no documento 07.

`musicas` ganhou campos opcionais TEXT NOT NULL com default vazio: `letra` e `cifra` (até 20.000 caracteres cada), `tom` (12), `notas` (2.000) e `letra_fonte` (120, URL de registro LRCLIB validada na API). As três tabelas e o modelo N:N permanecem. A API recebe esses campos em POST/PUT e os devolve na biblioteca e no JOIN de detalhes. PUTs antigos que omitem esses campos os preservam; string vazia os limpa. O corpo JSON agora aceita até 256 KB. `lib/song-material.cjs` compartilha a validação entre back-ends.

SQLite: ao iniciar, inspeciona colunas e adiciona as ausentes numa transação, sem recriar tabelas. Bancos novos recebem o schema completo. PostgreSQL: reaplicar `vercel/database/schema.sql`, que usa ADD COLUMN IF NOT EXISTS. Testar migrações em cópias; fazer backup de dados importantes antes de atualizar. Nenhuma migração foi aplicada ao banco principal durante o desenvolvimento.

`GET /api/letras?titulo=...&artista=...`: consulta externa ao LRCLIB pelo servidor, sem gravar dados nem abrir transação de banco; retorna até 8 opções com título/artista/álbum/duração/letra/fonte. Host fixo, query codificada, identificação do aplicativo, timeout de 10 s e bloqueio local de repetição respeitando Retry-After. A proteção é por processo, sem limite global entre instâncias Vercel. Sem API key; nenhuma alteração é enviada ao catálogo. Erros: 400 entrada inválida, 429 aguardar, 502 falha externa. `lib/lyrics.cjs` é compartilhado.

O usuário escolhe uma versão, revisa a prévia, importa para o formulário e salva explicitamente. Não há busca de cifras nem geração de acordes. `Rehearsal.jsx` só lê os dados carregados; navegação, fonte e rolagem são estado de sessão do React. Conteúdo é renderizado como texto, sem injetar HTML.

## 1. Arquitetura adotada

```text
NAVEGADOR
  React em src/ + Tailwind → build Vite em dist/
                  │ fetch HTTP /api/...
                  ▼
BACK-END NODE.JS
  server.js (roteamento, validação, SQL)
                  │ consultas parametrizadas
                  ▼
BANCO SQLITE
  dados/setlist.sqlite
  schema em database/schema.sql
```

**Stack atual:** React, React DOM, Tailwind CSS e Vite no front-end; Node.js `node:http`/`node:sqlite`/`node:fs`/`node:path` e SQLite local. O workspace online usa o driver oficial Neon. Requer Node.js **24.x** e npm. `npm ci` instala as dependências dos workspaces; `npm start` compila a interface e inicia SQLite; `npm run dev` inicia Vite com atualização da interface e a API local no mesmo processo. A troca do front-end foi autorizada expressamente pelo usuário; não adicionar novos frameworks sem necessidade.

**Persistência:** arquivo SQLite no diretório `dados/`, ignorado pelo Git. Criado automaticamente ao iniciar o servidor, juntamente com tabelas ainda inexistentes.

## 2. Estrutura de diretórios

```text
SETLIST/
├── AGENTS.md                         # instruções para o Codex
├── README.md                         # instruções de execução existentes
├── package.json                      # scripts e versão mínima do Node
├── server.js                         # API e acesso ao SQLite
├── index.html                       # entrada do Vite
├── src/                             # componentes React, hook, cliente HTTP e Tailwind
├── public/favicon.svg               # ativo estático
├── dist/                            # build gerado e ignorado pelo Git
├── lib/static.cjs                   # entrega restrita do build
├── scripts/dev.mjs                  # Vite e API local
├── vite.config.mjs
├── api/index.mjs                     # entrada Neon na Vercel
├── vercel.json                      # deploy na raiz
├── vercel/                          # workspace da API Neon e testes PostgreSQL
├── database/
│   ├── schema.sql                    # DDL do banco
│   ├── consultas.sql                 # consultas exigidas
│   └── consultar.js                  # execução das consultas em modo de leitura
├── dados/
│   ├── .gitkeep
│   └── setlist.sqlite                # gerado na execução, não versionar
├── tests/integration.test.js         # testes HTTP e SQLite temporário
└── docs/
    ├── 00_COMECE_AQUI_CODEX.md
    ├── 01_PRODUTO_E_ESCOPO.md
    ├── 02_ARQUITETURA_BANCO_E_API.md
    ├── 03_ROTEIRO_IMPLEMENTACAO_E_TESTES.md
    └── 04_HISTORICO_E_DECISOES.md
```

## 3. Modelo relacional

### Tabela `musicas`

| Campo | Tipo | Regras | Finalidade |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador da música |
| `titulo` | TEXT | NOT NULL | Nome da faixa |
| `artista` | TEXT | NOT NULL | Artista/banda |
| `duracao_segundos` | INTEGER | NOT NULL, CHECK 1..36000 | Duração em segundos |
| `criado_em` | TEXT | NOT NULL, DEFAULT datetime('now') | Data de criação |

### Tabela `setlists`

| Campo | Tipo | Regras | Finalidade |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador do repertório |
| `nome` | TEXT | NOT NULL | Nome da setlist |
| `evento` | TEXT | NOT NULL, DEFAULT '' | Evento ou local opcional na interface |
| `criado_em` | TEXT | NOT NULL, DEFAULT datetime('now') | Data de criação |

### Tabela `setlist_musicas`

| Campo | Tipo | Regras | Finalidade |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador da associação |
| `setlist_id` | INTEGER | FK NOT NULL → `setlists(id)`, ON DELETE CASCADE | Repertório |
| `musica_id` | INTEGER | FK NOT NULL → `musicas(id)`, ON DELETE CASCADE | Música da biblioteca |
| `posicao` | INTEGER | NOT NULL, CHECK >= 1 | Ordem no repertório |
| `(setlist_id, musica_id)` | combinação | UNIQUE | Impede repetir uma música no mesmo repertório |

**Cardinalidade:** `setlists` 1:N `setlist_musicas` N:1 `musicas`, representando N:N entre setlists e músicas.

**Relações:**

```text
setlists (1) ────── (N) setlist_musicas (N) ────── (1) musicas
   id  PK                   setlist_id FK              id PK
                            musica_id FK
                            posicao
```

**Integridade:** o back-end habilita explicitamente `PRAGMA foreign_keys = ON`. Na exclusão de uma música ou setlist, somente os vínculos associados são apagados automaticamente.

## 4. SQL exigido no trabalho

### 4.1 JOIN: músicas de cada repertório

```sql
SELECT s.nome AS setlist,
       sm.posicao,
       m.titulo AS musica,
       m.artista,
       m.duracao_segundos
FROM setlists AS s
INNER JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
INNER JOIN musicas AS m ON m.id = sm.musica_id
ORDER BY s.nome, sm.posicao;
```

Explicação para apresentação: `setlist_musicas` liga as tabelas principais, permitindo descobrir **qual música pertence a qual repertório e em que posição**. Esse `INNER JOIN` só retorna setlists com músicas.

### 4.2 Agregação: quantidade e duração por repertório

```sql
SELECT s.id,
       s.nome,
       COUNT(sm.id) AS quantidade_musicas,
       COALESCE(SUM(m.duracao_segundos), 0) AS duracao_total_segundos
FROM setlists AS s
LEFT JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
LEFT JOIN musicas AS m ON m.id = sm.musica_id
GROUP BY s.id, s.nome
ORDER BY s.id;
```

Explicação: `COUNT` calcula quantas faixas a setlist contém; `SUM` soma suas durações; `COALESCE` devolve zero quando a setlist está vazia; `LEFT JOIN` mantém repertórios mesmo sem músicas.

**Fonte de execução:** `database/consultas.sql` contém ambas as consultas e uma terceira de `COUNT(*)`. O back-end usa consulta equivalente com agregação ao listar setlists; os detalhes de uma setlist usam JOIN.

## 5. Contrato das rotas HTTP existentes

Prefixo: `/api`. Corpo de entrada/saída: JSON. IDs são inteiros positivos. Erros são devolvidos, em geral, como `{ "erro": "mensagem" }`.

| Método | Caminho | Corpo de entrada (quando aplicável) | Resultado principal |
|---|---|---|---|
| GET | `/api/musicas` | — | Lista de músicas |
| POST | `/api/musicas` | `{"titulo":"Intro","artista":"Banda","duracao_segundos":195}` | Música criada, HTTP 201 |
| PUT | `/api/musicas/:id` | mesmos campos do POST | Música atualizada |
| DELETE | `/api/musicas/:id` | — | Confirma exclusão |
| GET | `/api/setlists` | — | Setlists com `quantidade_musicas` e `duracao_total_segundos` |
| POST | `/api/setlists` | `{"nome":"Show de estreia","evento":"Campus"}` | Setlist criada, HTTP 201 |
| GET | `/api/setlists/:id` | — | Setlist, array de músicas ordenadas e totais |
| PUT | `/api/setlists/:id` | `{"nome":"Novo nome","evento":"Outro local"}` | Setlist atualizada |
| DELETE | `/api/setlists/:id` | — | Confirma exclusão |
| POST | `/api/setlists/:id/musicas` | `{"musica_id":1}` | Setlist atualizada com a faixa |
| DELETE | `/api/setlists/:id/musicas/:musicaId` | — | Setlist atualizada sem a faixa |
| PUT | `/api/setlists/:id/ordem` | `{"musica_ids":[3,1,2]}` | Setlist na nova ordem |

**Observações:** não existe, na implementação atual, `GET /api/musicas/:id` isolado; o CRUD de leitura é atendido pelo `GET /api/musicas`. Para edição de música, o front-end localiza o item na lista já carregada. Não inventar endpoints que não existem.

### Resposta ilustrativa de `GET /api/setlists/:id`

```json
{
  "id": 1,
  "nome": "Show de estreia",
  "evento": "Campus",
  "criado_em": "2026-11-01 12:00:00",
  "musicas": [
    { "id": 2, "titulo": "Entre Estrelas", "artista": "Banda Aurora", "duracao_segundos": 243, "posicao": 1 }
  ],
  "quantidade_musicas": 1,
  "duracao_total_segundos": 243
}
```

*Valores e data acima são ilustrativos, não registros garantidos do banco atual.*

## 6. Validações e erros

- Texto obrigatório (música: título/artista; setlist: nome), com limite atual de 120 caracteres.
- Duração inteira de 1 a 36.000 segundos no servidor; interface aceita formato `minutos:segundos` (ex.: `03:45`).
- Setlist e música devem existir para criar vínculo.
- Inclusão duplicada na mesma setlist é recusada (HTTP 409).
- Alterar ordem exige exatamente os IDs já associados à setlist (sem duplicatas e sem IDs extras).
- Corpo JSON inválido é rejeitado; payload muito grande também.
- Registros inexistentes produzem HTTP 404.
- O SQL utiliza parâmetros preparados para valores recebidos do cliente.

## 7. Dados iniciais, consistência e cautelas

- Somente ao criar um arquivo de banco novo, o servidor insere 5 músicas fictícias, 1 setlist e associa 3 faixas. Um banco existente vazio permanece vazio. `SETLIST_SEED=0` desativa os exemplos; `SETLIST_DB_PATH` seleciona outro arquivo para testes, sem alterar o banco padrão.
- A exclusão de uma música usada em setlist exclui os vínculos (caso de `ON DELETE CASCADE`).
- A remoção de um item pode deixar **lacunas no valor numérico `posicao`**; a UI mostra a ordem por sequência de lista, e a API ordena por `posicao`. Renumerar automaticamente é uma melhoria opcional, não um requisito do trabalho.
- A duração total individual devolvida por `GET /api/setlists/:id` é somada em JavaScript no servidor após o JOIN; os valores de `GET /api/setlists` são calculados com `SUM` no SQL. A consulta SQL com agregação está demonstrável em `database/consultas.sql`.
- O projeto foi pensado para uso local em sala; não deve ser anunciado como sistema pronto para Internet aberta, com autenticação ou segurança de produção.

## 8. Quando e como mudar a arquitetura

Só mudar stack, banco ou estrutura se ocorrer limitação comprovada que impeça cumprir os requisitos acadêmicos. Antes de qualquer mudança significativa:

1. descrever problema, evidência, impacto e alternativa mínima;
2. pedir aprovação se a mudança ampliar escopo ou criar dependências;
3. proteger dados existentes;
4. testar CRUD, JOIN, agregação e persistência após a alteração;
5. registrar decisão em `docs/04_HISTORICO_E_DECISOES.md`.
