# SETLIST

Organizador de repertórios musicais para músicos e bandas, com entrega acadêmica até o **fim de novembro de 2026**.

O front-end foi convertido para **React + Tailwind CSS + Vite**, conforme solicitação de 07/11/2026. Uma única interface em `src/` atende aos dois back-ends:

- **Local:** Node.js nativo + SQLite em `dados/setlist.sqlite`.
- **Online:** Vercel Functions + Neon/PostgreSQL, com API no workspace `vercel/`.

Os bancos são independentes. O modelo de três tabelas e as rotas de CRUD foram preservados. A versão online está publicada e foi validada com Neon real em **14/11/2026**: **https://carol-work.vercel.app/**. As evidências e os limites estão no histórico.

## Requisitos e instalação

Use **Node.js 24.x com npm**. Execute na raiz:

```powershell
npm ci
```

O repositório usa npm workspaces e um único `package-lock.json` na raiz. A instalação inclui React, React DOM, Vite, Tailwind, o driver Neon e PGlite somente para testes.

## Executar localmente

```powershell
npm start
```

Esse comando primeiro compila React e Tailwind em `dist/` e depois inicia o servidor local. Abra **http://localhost:3000** e mantenha o terminal aberto. Use `Ctrl+C` para encerrar.

Para outra porta, no PowerShell:

```powershell
$env:PORT = '3002'
npm start
```

Depois, abra `http://localhost:3002`.

Se preferir separar compilação e inicialização:

```powershell
npm run build
node server.js
```

`node server.js` sozinho depende de um build já existente. Na ausência dele, a página informa que é necessário compilar.

## Desenvolver com atualização da interface

```powershell
npm run dev
```

Abra **http://127.0.0.1:5173**. O mesmo processo inicia a API SQLite em 3000 e o Vite encaminha `/api` para ela. Se `PORT` estiver definida, a API e o proxy usam essa porta. O navegador recebe atualizações do front-end pelo Vite; após alterar código do back-end, reinicie o comando.

## Funcionalidades

- Biblioteca com cadastro, consulta, edição, exclusão e busca por título/artista.
- Setlists com cadastro, consulta, edição e exclusão.
- Associação das músicas da biblioteca, sem duplicar a mesma faixa no repertório.
- Reordenação com setas, remoção de vínculos e duração total atualizada.
- Confirmação das exclusões, validação de duração e mensagens de erro/sucesso.
- Letra e cifra por música, tom e notas de ensaio, persistidos no banco.
- Busca de letras no LRCLIB com seleção da versão e revisão antes de salvar.
- Busca de duração em Apple Music/iTunes e MusicBrainz, com seleção da gravação.
- Importação de cifras prontas por colagem ou arquivo TXT/HTML, com revisão e fonte.
- Modo de ensaio com navegação pela sequência, fonte ajustável e rolagem opcional.
- Filtros de músicas com letra/cifra e movimentos discretos com suporte a movimento reduzido.
- Interface responsiva implementada em componentes React com classes Tailwind.

Duração pode vir do catálogo ou ser digitada em minutos:segundos para material autoral. É armazenada como inteiro de segundos. Ex.: 04:10 + 03:15 = **07:25**.

Remover uma faixa do repertório preserva a biblioteca. Excluir uma música remove seus vínculos. Excluir uma setlist preserva as músicas.

## Letras, cifras e ensaio

Na edição de uma música, informe título e artista em **Dados da música**, clique em **Buscar duração** e escolha a gravação. Apple Music/iTunes é o catálogo inicial; MusicBrainz é a alternativa. O campo é preenchido automaticamente ao escolher, sem substituir título/artista. Versões ao vivo podem ter tempos diferentes. Para músicas autorais, informe a duração manualmente.

Em **Letra e cifra**, use **Buscar no Cifra Club** ou **Buscar no Letras** para localizar o material. Você pode preencher apenas **Link da cifra** e salvar a música, sem importar texto. Ao iniciar o ensaio pela biblioteca ou pelo repertório, **Abrir cifra no Cifra Club** abre a página exata em outra aba e mantém o ensaio aberto. O link pode ser editado ou removido no mesmo campo; o filtro Com cifra também inclui músicas com link salvo.

Para importar o conteúdo, copie a cifra pronta, cole em **Cifra copiada** e clique em **Revisar cifra colada → Usar esta cifra**. Não é necessário escrever os acordes. Também aceita arquivo TXT ou página HTML salva com um bloco `pre`; HTML não é executado. O link sozinho **não baixa** a cifra: não foi encontrada uma API pública documentada desses sites, e o acesso direto pelo servidor recebeu HTTP 403. A importação não contorna bloqueios ou áreas pagas. Mais detalhes em `docs/07_CATALOGOS_E_IMPORTACAO.md`.

Para letras, clique em **Buscar letra**, confira a versão/prévia e escolha **Usar esta letra**. Se a duração estiver vazia, a duração válida do LRCLIB também a preenche; uma duração já informada é preservada. Todos os materiais ficam em rascunho até **Salvar música**. Catálogos podem falhar ou não ter a faixa; a edição manual continua disponível. Cifras preservam os espaços de alinhamento.

Clique no título de uma música ou em **Iniciar ensaio** no repertório. Alterne letra/cifra, ajuste a fonte, ative/pare a rolagem ou navegue com ←/→. Esses controles só mudam a leitura; não alteram o conteúdo gravado. O material salvo pode ser lido sem consultar o catálogo novamente.

## Dados e integridade

O banco local é criado automaticamente. Na primeira abertura com esta versão, uma migração aditiva adiciona os campos de material e as fontes `letra_fonte`, `cifra_fonte` e `duracao_fonte`, sem recriar tabelas ou mudar IDs/vínculos. Antes de atualizar uma biblioteca importante, pare o servidor e faça uma cópia do SQLite. Apenas um arquivo novo recebe 5 músicas fictícias e 1 setlist com 3 faixas; esvaziar a biblioteca e reiniciar não reinserirá exemplos. Use `SETLIST_SEED=0` antes da primeira execução para começar vazio.

As tabelas são `musicas`, `setlists` e `setlist_musicas`, com PK, FK, CHECK, UNIQUE e cascatas. O SQL recebe parâmetros separados dos comandos. O total é calculado a partir das músicas, sem gravar uma soma desatualizada na setlist.

Não apague o banco para testar. Para usar um banco descartável em outro terminal:

```powershell
$env:PORT = '3001'
$env:SETLIST_SEED = '0'
$env:SETLIST_DB_PATH = Join-Path $env:TEMP 'setlist-interface.sqlite'
npm start
```

Para backup dos dados, pare o servidor e copie `dados/setlist.sqlite`. Bancos, credenciais, `dist/` e `node_modules/` não devem ser versionados. O backup do código anterior à migração está em `backups/pre-react-2026-11-07.zip`, sem bancos, segredos ou dependências.

## Testes

```powershell
npm run test:all
```

Esse comando compila a interface, executa os testes SQLite e depois os testes PostgreSQL/PGlite. São usados bancos descartáveis. A versão Neon não precisa de credenciais para esses testes.

Com o build já feito, os comandos diretos equivalentes são:

```powershell
node --test
node --test vercel/checks/integration.mjs
node vercel/scripts/check.mjs
```

Os testes verificam os arquivos React compilados, CRUD, PK/FK, duplicidade, ordem, JOIN, COUNT/SUM, cascatas, persistência e validação de duração. Os testes PGlite não comprovam conexão com o Neon remoto.

## Consultas SQL

Depois de iniciar a versão local pelo menos uma vez:

```powershell
npm run consultas
```

Ou `node database/consultar.js`. O script abre o banco em modo somente leitura e mostra JOIN, COUNT/SUM e COUNT da biblioteca.

## Estrutura

```text
src/App.jsx                    composição e navegação da aplicação
src/components/                biblioteca, repertórios, formulários e controles
src/hooks/useSetlistData.js     carregamento, seleção e mutações da API
src/lib/api.mjs                chamadas fetch HTTP/JSON
src/lib/format.mjs             conversão e apresentação de durações
src/styles.css                 Tailwind, tokens e pequenos estilos de base
index.html / vite.config.mjs   entrada e configuração do Vite
dist/                          resultado gerado do build
server.js / lib/static.cjs     API local e entrega restrita do build React
database/                      schema SQLite e consultas acadêmicas
vercel/                        API Neon, schema PostgreSQL e testes PGlite
api/index.mjs / vercel.json    entrada e configuração Vercel na raiz
scripts/dev.mjs                execução conjunta de Vite e API local
tests/                         testes locais e de duração
docs/                          escopo, arquitetura, histórico e guia de apresentação
```

## Deploy na Vercel com Neon

**O Root Directory agora é a raiz do repositório (`.`), e não `vercel/`.** Se já houver um projeto Vercel com a configuração anterior, atualize esse campo.

Configure Framework Preset **Vite**, instalação `npm ci`, build `npm run build` e saída **`dist`**. Conecte o Neon e confirme `DATABASE_URL`. Execute `vercel/database/schema.sql` no banco dedicado (também nos bancos já existentes: ele adiciona os novos campos de forma idempotente) e faça deploy/redeploy. O frontend chama `/api/...`, encaminhado para a API Neon.

Veja o [roteiro completo de deploy](vercel/README.md). Não use o schema PostgreSQL no arquivo SQLite local e não publique `.env` ou conexões com senha.

## Preparar a apresentação

Consulte o [guia de explicação para a professora](docs/05_GUIA_PARA_APRESENTAR_E_RESPONDER.md). Demonstre cadastro, edição, relacionamento N:N, ordem, soma 07:25, SQL, reinício e as três formas de remoção. As evidências e limitações estão no [histórico](docs/04_HISTORICO_E_DECISOES.md).
