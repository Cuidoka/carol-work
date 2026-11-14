# SETLIST — Guia para apresentar e responder à professora

> Atualização em 14/11/2026: prazo até o fim de novembro. Além do CRUD explicado abaixo, a edição salva letra, cifra, tom, notas e fontes. LRCLIB fornece letras; iTunes/MusicBrainz fornecem duração por gravação. Cifras prontas podem ser copiadas do Cifra Club/Letras e importadas por colagem/TXT/HTML com revisão, sem redigitar; não há download automático por link. Importar preenche o formulário, e Salvar faz POST/PUT no banco. O ensaio usa os dados já carregados, na ordem do JOIN, com fonte/rolagem/navegação em estado React. Os requisitos SQL continuam iguais. A suíte atual teve 23 testes locais e 11 PostgreSQL/PGlite aprovados; evidências no histórico e métodos no documento 07.

Preparado em **07/11/2026** e atualizado em **14/11/2026**. Prazo vigente: **fim de novembro de 2026**. A data anterior era 16/11. Use as falas como apoio e pratique os exemplos no aplicativo.

## 1. O que está pronto de verdade

Os requisitos acadêmicos estão implementados na versão local, com **React + Tailwind + Node.js + SQLite**. Após a conversão autorizada em 07/11, passaram 13 testes locais e 10 testes PostgreSQL/PGlite, além do build React. Cadastro, edição, vínculo, ordem, duração e exclusões foram conferidos no navegador. O histórico contém as evidências e as diferenças em relação à auditoria da interface antiga.

A pasta `vercel/` contém o segundo back-end, preparado para **Vercel + Neon/PostgreSQL**. Ambos usam a mesma interface React em `src/` e o mesmo build em `dist/`. Os testes PostgreSQL usam PGlite local; não provam funcionamento no Neon remoto. Deploy e acesso real pela internet continuam sem validação nesta sessão. Na Vercel, agora deve ser selecionada a **raiz do repositório**, não a pasta `vercel/`.

| Requisito da professora | Como o projeto atende |
|---|---|
| Pelo menos duas tabelas relacionadas | Há três: `musicas`, `setlists` e `setlist_musicas`. |
| PK e FK | Cada tabela tem PK `id`; a associativa tem FKs para música e setlist. |
| CRUD completo | Músicas e setlists podem ser criadas, consultadas, editadas e excluídas pela interface. |
| JOIN | Consulta relaciona repertórios, vínculos e músicas; o detalhe da setlist também usa JOIN. |
| Agregação OU subconsulta | Há `COUNT` e `SUM`. Não é necessário acrescentar subconsulta para cumprir essa alternativa. |
| Integração real | Navegador chama API; o servidor lê/grava no banco e responde com JSON. |
| Persistência | Registros e ordem permanecem depois de recarregar e reiniciar o servidor. |

## 2. Uma abertura que você pode falar

> “O SETLIST é um organizador de repertórios musicais. O usuário cadastra músicas numa biblioteca, cria repertórios para apresentações e escolhe a sequência das faixas. O sistema calcula a quantidade e a duração total de cada repertório. O objetivo do trabalho é demonstrar CRUD, relacionamento entre tabelas e integração entre interface, servidor e banco de dados.”

## 3. Front-end, back-end e banco: quem faz o quê

> “O projeto tem três partes. O front-end é a interface que aparece no navegador. O back-end recebe os pedidos e aplica as regras. O banco guarda os registros de forma persistente.”

Na versão local, os arquivos principais são:

| Parte | Arquivos | Responsabilidade |
|---|---|---|
| Estrutura e comportamento da interface | `src/App.jsx` e `src/components/` | Componentes React para navegação, biblioteca, repertórios e formulários. |
| Aparência | `src/styles.css` e classes Tailwind nos componentes | Cores, espaçamento, estados visuais e layout responsivo compilados para CSS. |
| Estado e comunicação | `src/hooks/useSetlistData.js` e `src/lib/api.mjs` | Carregar dados, selecionar repertório, controlar operações e chamar API com `fetch`. |
| Build | `index.html`, `vite.config.mjs`, `dist/` | Vite compila JSX e Tailwind para arquivos que o navegador executa. |
| Servidor/API | `server.js` | Receber HTTP, validar dados, executar SQL e devolver JSON. Também entrega os arquivos estáticos. |
| Estrutura do banco | `database/schema.sql` | Definir tabelas, colunas, PK, FK e restrições. |
| Dados persistidos | `dados/setlist.sqlite` | Guardar os registros da versão local. |
| Consultas para demonstrar | `database/consultas.sql` | JOIN, COUNT e SUM. |

**Node.js é o ambiente que executa JavaScript no servidor.** SQL é a linguagem das consultas ao banco. SQLite é o banco local utilizado. O back-end local continua sem Express ou ORM. Agora há dependências de front-end instaladas por npm: React, React DOM, Tailwind e Vite.

> “React é a biblioteca que organiza a interface em componentes reutilizáveis. Tailwind é o framework CSS usado para estilizar esses componentes. Vite é a ferramenta de desenvolvimento e compilação. O banco continua sendo acessado pelo back-end.”

`useState` mantém o estado da interface, como dados carregados, tela selecionada e formulário aberto. `useEffect` inicia o carregamento e controla o ciclo de vida de recursos da interface. O hook próprio `useSetlistData` centraliza leitura, seleção e operações da API. Os componentes recebem dados e funções por props; quando o estado muda, o React atualiza a tela. O projeto não monta mais a interface por grandes strings de `innerHTML`.

No desenvolvimento, Vite oferece atualização do front-end e encaminha `/api` para o Node.js. No build, ele gera JavaScript e CSS em `dist/`. Vite não substitui o servidor de regras ou o banco de dados.

O fluxo é:

```text
Usuário preenche formulário React
    → evento do componente chama o cliente HTTP (fetch/JSON)
    → API Node.js valida e executa SQL
    → SQLite grava ou consulta
    → API responde com JSON
    → hook consulta os dados atualizados e o React renderiza o novo estado
```

JSON é um formato de troca de dados. Ele é usado na comunicação; os registros persistentes ficam no banco.

## 4. Um cadastro explicado do começo ao fim

> “Quando cadastro uma música com duração 03:20, o JavaScript converte esse valor para 200 segundos e envia título, artista e duração à API. O servidor confere os campos e executa um INSERT parametrizado. O SQLite gera o ID. Depois a interface consulta novamente a biblioteca e mostra a música salva.”

Exemplo ilustrativo de corpo da requisição:

```json
{
  "titulo": "Música de teste",
  "artista": "Banda A",
  "duracao_segundos": 200
}
```

Isso é enviado para `POST /api/musicas`. A criação bem-sucedida devolve HTTP **201** e os dados do registro. Se houver erro de validação, a API devolve um erro em vez de cadastrar um dado inválido.

## 5. O CRUD

> “CRUD é a sigla de Create, Read, Update e Delete: criar, consultar, atualizar e excluir. Essas quatro operações existem tanto para músicas quanto para repertórios.”

| Operação | Ação na tela | Método HTTP | SQL principal |
|---|---|---|---|
| Create | Nova música / Nova setlist | POST | INSERT |
| Read | Listar biblioteca e repertórios; abrir detalhes | GET | SELECT |
| Update | Editar pelo lápis | PUT | UPDATE |
| Delete | Excluir pela lixeira e confirmar | DELETE | DELETE |

Exemplos de músicas:

- `POST /api/musicas`: cadastrar.
- `GET /api/musicas`: consultar a biblioteca.
- `PUT /api/musicas/1`: atualizar a música de ID 1.
- `DELETE /api/musicas/1`: excluir essa música.

Para repertórios, usa-se `/api/setlists`, com `GET /api/setlists/1` para o detalhe. Os números são exemplos; use os IDs que o banco realmente tiver.

O projeto não possui `GET /api/musicas/:id` isolado: a leitura é atendida pela listagem, e o formulário de edição usa os dados já carregados. Isso não impede o CRUD de leitura.

**Não confundir:** `CREATE TABLE` cria a estrutura do banco. O “Create” do CRUD de registros é feito principalmente por `INSERT`.

## 6. As três tabelas e o relacionamento N:N

> “A tabela musicas guarda título, artista e duração. A tabela setlists guarda nome e evento/local. A tabela setlist_musicas guarda a ligação entre elas e a posição da música em cada repertório.”

Uma setlist pode ter várias músicas. Uma música pode aparecer em várias setlists. Isso é um relacionamento **muitos para muitos (N:N)**. A tabela associativa transforma essa relação em duas relações 1:N.

Exemplo fictício de `setlist_musicas`:

| id | setlist_id | musica_id | posicao |
|---|---|---|---|
| 1 | 10 | 7 | 1 |
| 2 | 10 | 8 | 2 |
| 3 | 11 | 7 | 1 |

A música 7 aparece nas setlists 10 e 11, mas seu título, artista e duração ficam cadastrados uma única vez em `musicas`. Cada repertório pode dar a ela uma posição diferente.

> “A terceira tabela evita repetir os dados completos da mesma música em vários shows. Ela guarda os IDs e a informação que pertence à associação: a posição.”

## 7. PK, FK e restrições

**PK (chave primária):** identifica uma linha de forma única. Nas três tabelas, é a coluna `id`, gerada pelo banco. O título não é o identificador, porque duas músicas podem ter títulos iguais.

**FK (chave estrangeira):** referencia um registro de outra tabela. `setlist_id` aponta para `setlists.id`; `musica_id` aponta para `musicas.id`. O banco não aceita vínculo para um repertório ou música inexistente quando a integridade está habilitada.

Na versão SQLite, `PRAGMA foreign_keys = ON` é executado pelo schema ao abrir a aplicação. No PostgreSQL, as FKs definidas no schema são aplicadas diretamente pelo banco.

Outras restrições:

- `NOT NULL`: impede ausência de valor em campos obrigatórios.
- `CHECK`: limita duração e posição, além dos textos previstos no schema.
- `UNIQUE(setlist_id, musica_id)`: impede repetir a mesma música no mesmo repertório. Ela pode aparecer em outro repertório.

Essa combinação `UNIQUE` **não é a PK** da associativa: a PK é seu próprio `id`.

## 8. Os três tipos de remoção

| Ação | Resultado |
|---|---|
| Remover faixa com `×` no repertório | Exclui somente o vínculo em `setlist_musicas`; música continua na biblioteca. |
| Excluir uma música da biblioteca | Exclui a música e seus vínculos em todos os repertórios; as setlists continuam existindo. |
| Excluir um repertório | Exclui a setlist e seus vínculos; as músicas continuam na biblioteca. |

> “As FKs usam ON DELETE CASCADE. Quando uma música ou setlist é excluída, o banco remove automaticamente os vínculos dependentes. A cascata não apaga a outra entidade principal.”

## 9. O JOIN explicado

> “O JOIN combina registros de tabelas relacionadas. No SETLIST, ele permite descobrir quais músicas pertencem a cada repertório, quem é o artista e qual é a ordem.”

Consulta executável da versão local:

```sql
SELECT s.nome AS setlist, sm.posicao, m.titulo AS musica,
       m.artista, m.duracao_segundos
FROM setlists AS s
INNER JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
INNER JOIN musicas AS m ON m.id = sm.musica_id
ORDER BY s.nome, sm.posicao, sm.id;
```

`s`, `sm` e `m` são apelidos das tabelas. O primeiro `ON` liga a setlist aos vínculos; o segundo liga cada vínculo à música. O `INNER JOIN` retorna as associações existentes, por isso uma setlist vazia não aparece nessa consulta.

## 10. COUNT, SUM, GROUP BY, LEFT JOIN e COALESCE

> “COUNT conta quantas faixas há em cada repertório. SUM soma suas durações. GROUP BY separa o cálculo por repertório, para não misturar os totais dos shows.”

```sql
SELECT s.id, s.nome,
       COUNT(sm.id) AS quantidade_musicas,
       COALESCE(SUM(m.duracao_segundos), 0) AS duracao_total_segundos
FROM setlists AS s
LEFT JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
LEFT JOIN musicas AS m ON m.id = sm.musica_id
GROUP BY s.id, s.nome
ORDER BY s.id;
```

- `LEFT JOIN` mantém uma setlist no resultado mesmo que ela esteja vazia.
- `COUNT(sm.id)` conta os vínculos encontrados. Numa setlist vazia, retorna zero. Usar `COUNT(*)` nesse mesmo LEFT JOIN contaria a linha da setlist, produzindo um resultado inadequado para o número de músicas.
- `SUM` retorna `NULL` quando não há valores para somar; `COALESCE(..., 0)` troca esse resultado por zero.

**Detalhe fiel ao código:** a listagem de setlists calcula COUNT/SUM no SQL. No detalhe de uma setlist, a API recebe as faixas por JOIN e soma suas durações em JavaScript. Ambas as consultas SQL exigidas existem e são executáveis; não diga que todos os totais de toda tela são calculados exclusivamente pelo SQL.

## 11. Duração, ordem, validações e transações

> “A duração é armazenada em segundos porque isso facilita somar os valores sem precisar interpretar texto como 03:20 dentro do banco. Na tela, converto novamente para minutos e segundos.”

04:10 = 250 segundos; 03:15 = 195 segundos. O total é 445 segundos, ou **07:25**. A duração total não é uma coluna gravada na setlist: é calculada a partir das músicas atuais.

> “A ordem fica no campo posicao da tabela associativa. Ao usar as setas, a interface envia os IDs na ordem desejada e o servidor atualiza as posições.”

A API exige exatamente os IDs já associados, sem faltas, repetições ou faixas extras. A reordenação usa uma **transação**: confirma todas as alterações juntas com COMMIT ou desfaz com ROLLBACK se houver falha. Remoções podem deixar lacunas numéricas em `posicao`; a lista continua ordenada corretamente e exibe sua sequência a partir de 1.

O servidor valida título/artista/nome obrigatórios, até 120 caracteres, IDs e duração inteira de 1 a 36.000 segundos. A interface também ajuda com campos e formato, mas a validação do servidor continua necessária: uma requisição pode ser enviada sem usar o formulário.

**SQL parametrizado:** no SQLite, os valores são enviados separadamente ao SQL por parâmetros `?`; no PostgreSQL, por `$1`, `$2` etc. Isso evita montar o comando SQL concatenando diretamente o texto digitado pelo usuário.

## 12. Persistência e as duas versões

> “A página pode manter uma lista em memória para renderizar a interface, mas a fonte persistente é o banco. Ao recarregar, o JavaScript pede os registros à API novamente. Ao reiniciar o servidor, ele reabre o arquivo SQLite com os dados que já estavam salvos.”

O projeto não usa `localStorage` como banco de músicas/repertórios. A busca por título ou artista é um filtro feito no navegador sobre a lista que veio da API.

| Local | Versão preparada para nuvem |
|---|---|
| Node.js na máquina | Função Node.js na Vercel |
| SQLite em `dados/setlist.sqlite` | PostgreSQL remoto no Neon |
| `server.js` | `api/index.mjs` → `vercel/api/index.mjs` + `vercel/lib/handler.mjs` |
| Parâmetros `?` e AUTOINCREMENT | Parâmetros `$1` e IDENTITY |
| Exemplos no primeiro banco novo | Banco remoto começa vazio |

As versões não compartilham registros automaticamente. A variável `DATABASE_URL` da versão online contém a conexão e deve ficar no servidor. Na revisão atual, não houve validação de acesso ao Neon remoto ou URL de deploy. Se apresentar localmente, explique que está usando SQLite. Só diga que a versão online está funcionando depois de demonstrá-la na URL real.

O front-end é compartilhado entre as versões: não há mais duas cópias da interface. A separação está no back-end e no banco utilizado.

## 13. Roteiro prático de 4 a 6 minutos

1. **Objetivo:** explique o organizador de repertórios em duas frases.
2. **Arquitetura:** mostre componentes React + Tailwind → API Node.js → SQLite. Explique que Vite compila o front-end.
3. **Banco:** abra `database/schema.sql`, mostre as três tabelas e destaque PK, FK e UNIQUE.
4. **CRUD:** cadastre uma música de 03:20 e edite para 04:10. Cadastre outra de 03:15.
5. **Relacionamento:** crie uma setlist, adicione as duas faixas e mostre 07:25. Mude a ordem.
6. **SQL:** execute `node database/consultar.js`; explique os resultados de JOIN e COUNT/SUM.
7. **Persistência:** recarregue e reinicie o servidor; confira registros e ordem.
8. **Exclusões:** usando somente dados de teste, demonstre remover vínculo, excluir música e excluir setlist, explicando o que é preservado em cada ação.

Para iniciar a versão local, na raiz:

```powershell
npm ci
npm start
```

Abra `http://localhost:3000`. `npm start` compila antes de iniciar. `node server.js` pode ser usado diretamente depois de `npm run build`. Para desenvolvimento, `npm run dev` abre Vite em `http://127.0.0.1:5173`, com API local. Se usar uma porta alternativa configurada por `PORT`, o comando de desenvolvimento encaminha a API para essa porta. Mantenha o terminal aberto e execute as consultas em outro terminal.

## 14. Respostas curtas para perguntas comuns

**“Por que três tabelas se pedi pelo menos duas?”**

> “Porque duas representam as entidades e a terceira representa o relacionamento muitos para muitos. Assim, reutilizo a mesma música em shows diferentes e guardo a ordem em cada show.”

**“Onde está o back-end?”**

> “Na versão local está no server.js. Ele recebe as requisições HTTP, valida os dados e executa SQL no SQLite.”

**“O banco fica no navegador?”**

> “Não. Na versão local ele é um arquivo SQLite acessado pelo servidor. O navegador chama a API e recebe JSON.”

**“Como sei que o CRUD é real?”**

> “Posso cadastrar, editar e excluir pela interface e conferir o efeito no banco. Os dados salvos continuam presentes depois de reiniciar o servidor.”

**“Vocês fizeram subconsulta?”**

> “A alternativa escolhida foi agregação com COUNT e SUM, que atende ao item de agregação ou subconsulta.”

**“A música pode estar em dois shows?”**

> “Sim. São dois vínculos apontando para o mesmo registro de música. Só não permitimos repeti-la dentro da mesma setlist.”

**“Se eu editar a duração, o total fica antigo?”**

> “A soma usa a duração atual cadastrada da música. Depois da edição, os dados são consultados novamente e o total é recalculado.”

**“O sistema toca as músicas ou conecta ao Spotify?”**

> “O objetivo é organizar o repertório e calcular a duração. Não há reprodução de áudio ou integração com streaming no escopo.”

**“Como foi testado?”**

> “Na revisão de 14/11, passaram 23 testes locais e 11 PostgreSQL/PGlite. O build também passou. CRUD, JOIN, agregações e persistência foram testados com bancos descartáveis e no Neon real. A publicação anterior também passou por smoke e navegador na URL pública. As novas funções de catálogo/importação têm evidências próprias no histórico; testes de rede e de interface são separados dos testes com respostas controladas.”

## 15. Cuidados com a explicação

Não chame a versão local de PostgreSQL; ela usa SQLite. Não chame Vercel de banco de dados; ela hospeda a aplicação, enquanto Neon fornece PostgreSQL. Não diga que os registros existem só em arrays ou no HTML. Não chame UNIQUE de chave primária composta. Não diga que todos os testes foram feitos na nuvem. Não diga que login, áudio ou subconsulta são obrigatórios no enunciado registrado.

Para a apresentação, saiba executar pessoalmente o cadastro, a edição, a consulta, as três formas de remoção e o comando de SQL, e explicar por que cada resultado aparece.
