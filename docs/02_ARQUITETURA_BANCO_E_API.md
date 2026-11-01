# SETLIST — Arquitetura técnica, banco de dados e API

**Natureza deste documento:** especificação técnica do MVP, implementada em 01/11/2026. A pasta inicial só continha documentação; o usuário autorizou criar o código. Consulte o histórico para evidências. O código real deve ser consultado antes de modificar funcionalidades.

**Versão online autorizada posteriormente:** este documento descreve a aplicação local da raiz, que continua com SQLite e sem dependências externas. A pasta independente `vercel/` foi adaptada para **Neon/PostgreSQL**, por escolha explícita do usuário. Seu contrato de rotas e modelo N:N são equivalentes; o schema e a conexão são próprios. Consulte `vercel/README.md`. Não aplicar o schema PostgreSQL ao banco SQLite nem presumir que os dados são compartilhados.

## 1. Arquitetura adotada

```text
NAVEGADOR
  public/index.html + styles.css + app.js
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

**Stack existente:** HTML5, CSS3, JavaScript sem framework, Node.js `node:http`/`node:sqlite`/`node:fs`/`node:path` e SQLite local. `package.json` define `npm start` e requer Node >=22.13.0. Recomendado Node.js 24 LTS. **Não migrar automaticamente para React, Express, MySQL, PostgreSQL ou ORM**: a escolha atual já satisfaz o enunciado e reduz dependências.

**Persistência:** arquivo SQLite no diretório `dados/`, ignorado pelo Git. Criado automaticamente ao iniciar o servidor, juntamente com tabelas ainda inexistentes.

## 2. Estrutura de diretórios

```text
SETLIST/
├── AGENTS.md                         # instruções para o Codex
├── README.md                         # instruções de execução existentes
├── package.json                      # scripts e versão mínima do Node
├── server.js                         # API e acesso ao SQLite
├── public/
│   ├── index.html                    # interface
│   ├── styles.css                    # apresentação
│   └── app.js                        # eventos e fetch HTTP
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
