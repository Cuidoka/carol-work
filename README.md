# SETLIST

Organizador de repertórios musicais para ensaios e apresentações. Cadastre músicas, monte a sequência do show e acompanhe sua duração em uma interface feita com React e Tailwind CSS.

**[Acessar o SETLIST](https://carol-work.vercel.app/)**

## Funcionalidades

- Cadastro, edição, busca e exclusão de músicas e repertórios.
- Organização da ordem das faixas e cálculo da duração total.
- Letras, cifras, tom, notas e links externos por música.
- Busca de letras e duração em catálogos externos, com revisão antes de salvar.
- Busca de músicas no Cifra Club e seleção do link da cifra, sem substituir o texto já cadastrado.
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

## Cifra Club — RF-CIFRA-001

Na edição de uma música, preencha **título e artista** em Informações. Em **Material de ensaio → Buscar no Cifra Club**, confira a música encontrada e clique em **Usar link desta cifra**. O link só é persistido ao salvar a música. O texto da cifra, título e artista existentes são preservados. No ensaio, o botão **Abrir cifra no Cifra Club** abre a fonte em outra aba.

Para ler o texto dentro do SETLIST, use **Buscar ou importar cifra pronta** e cole o conteúdo ou importe um TXT/HTML. A busca de sugestões não fornece acordes, tablatura, letra ou tom e não importa esse material automaticamente.

### Contrato e limites observados

- Endpoint externo verificado em **16/11/2026**: `https://solr.sscdn.co/cifraclub-explore/v1/search/suggest?q=dois+rios+skank&lang=pt`.
- Resposta HTTP 200: `results` mistura músicas, artistas e álbuns. O SETLIST aceita somente `type: "song"`, com nome, artista e slugs válidos, e monta o link HTTPS do Cifra Club.
- Rota do SETLIST: `GET /api/cifras?titulo=Dois+Rios&artista=Skank`. Retorna até 12 objetos `{ id, titulo, artista, fonte }`. O contrato interno não contém texto de cifra.
- Backend local e Vercel compartilham o mesmo adaptador. Somente o endpoint fixo é buscado; URLs fornecidas pelo usuário ou pela fonte não são consultadas. Redirecionamentos são rejeitados.
- Timeout de 10 segundos, cache de até 40 buscas por 3 minutos e intervalo mínimo de 1 segundo entre consultas novas por instância. O limite é local à instância, não uma cota global na Vercel. HTTP 429 respeita `Retry-After` com espera limitada a 1 hora; indisponibilidade ou contrato inesperado retornam 502 com alternativa manual.
- A consulta só ocorre ao clicar no botão e envia apenas título e artista ao serviço. Não usa chave de API, não envia notas, letras ou cifras e não grava resultados automaticamente.
- Não foi encontrada documentação pública oficial de API para esse endpoint. O teste não exigiu autenticação e retornou CORS `*`; isso não estabelece estabilidade, preço ou condições de uso para integrações de terceiros. Não há serviço pago adicionado pelo SETLIST.
- A consulta direta à página de Dois Rios retornou HTTP 403 neste ambiente. Não foi implementada extração do HTML nem incorporação por iframe. O acesso a conteúdo integral permanece limitado à importação manual existente.

### Verificação

Com Node.js 24.x, execute `npm test` e `npm run build`. Não há scripts de lint ou format configurados no projeto.

Em 16/11/2026, passaram os **16 testes** de `tests/cifraclub.test.cjs` (T-CIFRA-001 a T-CIFRA-011) e o build de produção. Os testes usam respostas controladas e SQLite em memória: cobrem validação, parâmetros, filtragem, cache, concorrência, erros, salvamento/preservação e o handler Vercel sem conexão de banco.

Testes reais separados: o serviço respondeu 200 para Dois Rios / Skank, João e Maria / Chico Buarque, busca sem resultados e busca por artista. No navegador local, a busca encontrou Dois Rios / Skank, preencheu o link, preservou um texto autoral de teste, salvou a música e exibiu esse texto e o link no ensaio. Nenhum dado de produção foi usado; o banco desse teste ficou em memória.

**NÃO TESTADO:** deploy da mudança na Vercel, persistência em Neon real, disponibilidade futura do endpoint e carregamento automático do texto do Cifra Club. A fonte para esse último recurso ainda precisa ser identificada e validada.
