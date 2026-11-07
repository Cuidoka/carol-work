# SETLIST — React + Tailwind na Vercel com Neon

A interface React/Tailwind fica em **`src/` na raiz** e é usada tanto pelo SQLite local quanto por esta API Neon. A pasta `vercel/` é um workspace de back-end, não mais um site autônomo.

## Configuração de deploy atual

**Root Directory: raiz do repositório (`.`), e não `vercel`.** Este campo mudou com a migração React. O arquivo de configuração válido é o `vercel.json` da raiz.

| Campo na Vercel | Valor |
|---|---|
| Root Directory | raiz / `.` |
| Framework Preset | Vite |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

O build compila React/Tailwind. As chamadas `/api/...` são encaminhadas a `api/index.mjs`, que usa a implementação PostgreSQL deste workspace. Os arquivos JSX e a conexão do banco não vão para a pasta pública.

## Conectar Neon

1. Importe o repositório do GitHub na Vercel, com as configurações acima.
2. Em Storage/Marketplace, crie ou conecte um banco **Neon** dedicado ao SETLIST.
3. Conecte o banco ao projeto e confirme a variável **`DATABASE_URL`** no ambiente que será publicado. A integração Neon pode configurá-la automaticamente. A URL contém senha; não a envie pelo chat nem a publique no GitHub.
4. No SQL Editor do Neon, execute **`vercel/database/schema.sql`**. Esse schema é PostgreSQL; o arquivo `database/schema.sql` da raiz é SQLite e não deve ser usado no Neon.
5. Faça novo deploy/redeploy após configurar o banco e as variáveis.

O banco remoto começa vazio. A inicialização cria tabelas/índices sem apagar registros e sem importar o SQLite local. Para bancos de Preview, use uma branch/schema já inicializada ou execute o schema nesse banco antes de testar.

## Inicializar pelo computador (alternativa ao SQL Editor)

Na raiz, instale uma vez com `npm ci`. Copie `vercel/.env.example` para `vercel/.env.local` e configure DATABASE_URL somente nesse arquivo local. Depois:

```powershell
npm run db:init:neon
```

O comando aplica o schema PostgreSQL e verifica as duas FKs com cascata. Para abrir o mesmo frontend React conectado ao Neon:

```powershell
npm run build
npm run preview:neon
```

Abra `http://localhost:3004`. Isso altera o banco remoto selecionado em DATABASE_URL; use um banco de teste. Não há fallback SQLite na versão online.

## Testes

Na raiz:

```powershell
npm run test:all
```

Os testes locais usam SQLite temporário; os testes deste workspace executam SQL num motor PostgreSQL em WASM (PGlite). Os dois back-ends entregam o mesmo build React, que também é verificado. Eles não comprovam que a infraestrutura Vercel ou o transporte WebSocket até o Neon remoto estão funcionando.

Depois do deploy:

```powershell
npm run smoke --workspace setlist-vercel -- https://SEU-PROJETO.vercel.app
```

O teste cria seus próprios registros e verifica CRUD, duplicidade, ordem, totais, remoção de vínculo e cascatas; limpa somente os IDs criados. Se uma falha impedir a limpeza, informa os IDs pendentes. Para uma URL protegida, execute os fluxos no navegador autorizado ou use ferramentas de acesso da conta sem desativar a proteção apenas para os testes.

No navegador, cadastre 04:10 e 03:15, crie uma setlist e confirme **07:25**. Edite os campos, mude a ordem, recarregue e confira persistência. Remova uma faixa do repertório e confirme que continua na biblioteca; exclua música e setlist verificando suas cascatas. Depois de um novo deploy, confira novamente os dados no banco remoto.

## Estado e limites

API Neon com SQL parametrizado, transações e FKs; interface React única e responsiva. O driver abre uma conexão WebSocket por requisição e a encerra ao terminar. Não são usados localStorage nem arquivos em `/tmp` como banco de produção.

Sem login no aplicativo, visitantes autorizados à URL compartilham registros. Use dados fictícios e a proteção de deploy adequada ao público da demonstração. O escopo não inclui contas de usuário ou áudio.

**Ainda não foi realizado deploy nem teste contra um banco Neon remoto nesta migração.** O build e os testes locais não substituem essa etapa.

Referências: [Neon na Vercel](https://neon.com/docs/guides/vercel-managed-integration), [driver Neon](https://github.com/neondatabase/serverless), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite).
