# SETLIST

Organizador de repertórios musicais para ensaios e apresentações. Cadastre músicas, monte a sequência do show e acompanhe sua duração em uma interface feita com React e Tailwind CSS.

**[Acessar o SETLIST](https://carol-work.vercel.app/)**

## Funcionalidades

- Cadastro, edição, busca e exclusão de músicas e repertórios.
- Organização da ordem das faixas e cálculo da duração total.
- Letras, cifras, tom, notas e links externos por música.
- Busca de letras e duração em catálogos externos, com revisão antes de salvar.
- Modo de ensaio com leitura, navegação, ajuste de fonte e rolagem.
- Backup e restauração em JSON, impressão de repertórios e proteção de alterações não salvas.

## Tecnologias

- **Front-end:** React, Tailwind CSS e Vite.
- **Back-end:** Node.js, com SQLite na execução local e PostgreSQL/Neon na Vercel.

O banco relaciona `musicas`, `setlists` e `setlist_musicas` em uma associação N:N, com chaves estrangeiras e consultas SQL para os totais. As bases local e online são independentes. A versão acadêmica online possui uma biblioteca compartilhada entre visitantes.

## Executar localmente

Requer **Node.js 24.x** e npm.

```bash
npm ci
npm start
```

Abra **http://localhost:3000**. O build é gerado automaticamente e o SQLite é criado em `dados/setlist.sqlite`.

Para desenvolvimento com atualização da interface, use `npm run dev` e acesse **http://127.0.0.1:5173**.

## Deploy

Na Vercel, use a raiz do repositório, preset **Vite**, instalação `npm ci`, build `npm run build` e saída `dist`.

Configure `DATABASE_URL` no servidor e aplique `vercel/database/schema.sql` no Neon antes de publicar. O modelo de variáveis está em `vercel/.env.example`; com `vercel/.env.local` configurado, a inicialização também pode ser feita por `npm run db:init:neon`.

Bancos locais, backups e credenciais ficam fora do versionamento.
