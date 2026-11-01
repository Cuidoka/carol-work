# SETLIST — versão separada para Vercel

Esta pasta é uma segunda versão. A aplicação local continua na raiz do repositório, sem alterações em seu servidor, interface ou banco. O deploy precisa usar **esta pasta `vercel/` como Root Directory**; se publicar a raiz, estará selecionando a versão local.

## O que está preparado e o que falta

- Mesma interface e mesmo modelo relacional de três tabelas da versão local.
- API assíncrona em `api/index.mjs`, com driver oficial `@neondatabase/serverless` para Neon/PostgreSQL.
- SQL parametrizado (`$1`, `$2`...), transações, PK/FK, cascatas, CRUD, JOIN, COUNT/SUM e reordenação.
- A Vercel entrega os arquivos de `public/`; requisições `/api/...` vão para uma única função.
- Não usa SQLite em `/tmp`, não importa o banco local e não reinicializa dados a cada requisição.
- O banco online começa vazio. Os registros das duas versões são independentes.
- **Ainda não publicado nem validado em um banco Neon remoto nesta sessão.** Os testes executam o SQL num motor PostgreSQL em WASM (PGlite) com dados temporários. Validam handler, schema e consultas, mas não a conexão WebSocket do driver com o Neon nem a infraestrutura Vercel.

## 1. Conectar Neon pelo painel da Vercel

1. Envie o projeto ao GitHub e importe-o na Vercel com as configurações da seção 2.
2. No painel do projeto, abra **Storage** e escolha criar/conectar um banco **Neon** pelo Marketplace. Use um banco dedicado, por exemplo `setlist-online`.
3. Conecte o banco ao projeto e selecione os ambientes de deploy. A integração configura a variável **`DATABASE_URL`**. Confira sua presença em Settings → Environment Variables. Use bancos/branches separados para testes e produção quando necessário.
4. Abra o console Neon pelo painel da integração e, no **SQL Editor** do banco selecionado, execute o arquivo **`vercel/database/schema.sql`** do repositório (nesta pasta, `database/schema.sql`). Esse arquivo é PostgreSQL; não use o schema SQLite da raiz.
5. Faça um novo deploy depois de conectar o banco/configurar as variáveis. Não envie a URL de conexão pelo chat, não a publique no GitHub e não a coloque em `public/` — ela contém uma senha.

Se já tiver uma conta Neon independente, também pode criar um banco no [console Neon](https://console.neon.tech/) e configurar manualmente `DATABASE_URL` na Vercel. Não são mais necessárias variáveis do Turso.

Se preferir inicializar pelo terminal, com Node.js 24 e npm:

```powershell
cd vercel
npm ci
Copy-Item .env.example .env.local
```

Edite `.env.local` no seu computador com `DATABASE_URL`, copiada da integração ou do botão Connect do Neon. Depois:

```powershell
npm run db:init
```

O comando cria o schema e confirma as duas FKs com cascata, sem copiar dados da versão local. O PostgreSQL aplica essas FKs diretamente; não há `PRAGMA`. O schema usa `GENERATED ALWAYS AS IDENTITY` para IDs e `TIMESTAMPTZ` para datas. Os campos e a relação N:N são os mesmos. Não existe migração automática de SQLite ou Turso: esta versão começa com um banco Neon novo.

## 2. Publicar pelo GitHub na Vercel

1. Envie o projeto para um repositório GitHub. Não envie `.env.local`, tokens, bancos `.sqlite` ou `node_modules`.
2. Entre na Vercel com seu GitHub e importe esse repositório como **novo projeto**, por exemplo `setlist-online`.
3. Configure:

| Campo | Valor |
|---|---|
| Root Directory | `vercel` |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `public` |

4. Conecte o Neon pela seção 1 e confirme a variável **`DATABASE_URL`** no ambiente que será publicado. A conexão pooled fornecida pela integração pode ser utilizada. Nenhuma senha vai para o frontend.
5. Faça o deploy. Se adicionar ou mudar variáveis depois, faça um novo deploy.
6. Abra a URL gerada e execute a validação abaixo. Uma página que abre sozinha não prova que o banco está funcionando.

Sem login no aplicativo, os visitantes com acesso à URL compartilham os mesmos registros e podem alterá-los. Para esta demonstração, use dados fictícios e configure a proteção de acesso do projeto na Vercel conforme seu público. A conexão do banco permanece no backend.

## 3. Verificar se está funcionando online

Com as dependências instaladas, na pasta `vercel/`:

```powershell
npm run smoke -- https://SEU-PROJETO.vercel.app
```

Esse teste cria apenas registros próprios identificados como teste, executa CRUD, duplicidade, reordenação, totais, remoção de vínculo e ambas as cascatas; ao final, exclui os IDs que criou. Não apaga tabelas nem registros já existentes. Se uma falha de conexão impedir a limpeza, os IDs pendentes são informados no terminal. Se a URL exigir autenticação da Vercel, faça a validação no navegador autenticado ou use as ferramentas autorizadas de acesso dessa conta; não desative a proteção apenas para o teste.

No navegador:

1. Cadastre uma música de 03:20, edite título/artista e duração para 04:10.
2. Cadastre outra de 03:15 e crie uma setlist com as duas. Confira **07:25**.
3. Edite nome/evento, altere a ordem e recarregue; os valores devem permanecer.
4. Remova uma faixa do repertório; ela deve continuar na biblioteca.
5. Exclua uma música usada em repertórios; os vínculos devem desaparecer, preservando as setlists.
6. Exclua uma setlist com faixas; as músicas devem continuar na biblioteca.
7. Abra a URL em outra sessão autorizada e confira a persistência. Depois de um novo deploy, confirme novamente os registros — o banco remoto deve preservá-los.

## 4. Testar esta versão antes do deploy

```powershell
npm ci
npm test
npm run build
```

Os testes usam PostgreSQL/PGlite com diretório temporário, não o Neon real. Não precisam de `DATABASE_URL`. PGlite é dependência de desenvolvimento e não é importado pela API publicada. Para testar localmente conectado ao Neon configurado em `.env.local`, use `npm start` e abra `http://localhost:3004`. Isso altera o banco remoto selecionado; utilize um banco de teste.

A API usa o driver Neon via WebSocket, com uma conexão por requisição, encerrada ao final. Node.js 24 fornece WebSocket nativo. A reordenação é transacional e as alterações na mesma setlist usam bloqueio de linha. Quantidade e duração agregadas são devolvidas como números JSON para manter a interface compatível.

`npm run build` verifica sintaxe, arquivos estáticos e a estrutura básica do `vercel.json`. Não equivale ao build executado pela infraestrutura Vercel.

## Referências oficiais

- [Funções Node.js na Vercel](https://vercel.com/docs/functions/runtimes/node-js)
- [Deploy a partir do GitHub](https://vercel.com/docs/git)
- [Integração Neon gerenciada pela Vercel](https://neon.com/docs/guides/vercel-managed-integration)
- [Driver oficial Neon](https://github.com/neondatabase/serverless)
- [Motor PostgreSQL/PGlite usado somente nos testes](https://pglite.dev/docs/)
- [Proteção dos deployments](https://vercel.com/docs/deployment-protection)
