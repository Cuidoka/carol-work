# Changelog

## Não publicado — 2026-11-16

### RF-CIFRA-001 — Busca no Cifra Club

- Adicionada a rota `GET /api/cifras` aos servidores SQLite e Vercel, consultando o endpoint fixo de sugestões fornecido pelo usuário.
- Adicionada busca por título/artista em Material de ensaio, com seleção explícita do link da cifra e preservação do conteúdo existente até salvar.
- Resultados limitados a músicas, com validação de slugs, deduplicação, cache, timeout e tratamento de indisponibilidade e limite de consultas.
- Mantida a importação de texto por colagem e TXT/HTML para leitura dentro do site. O endpoint de sugestões não contém o texto da cifra; a consulta direta à página da cifra retornou HTTP 403.
- Adicionados 16 testes rastreáveis (T-CIFRA-001 a T-CIFRA-011), executados com sucesso no Node 24.22.3, e comando `npm test`. Build de produção e fluxo local de busca, seleção, salvamento e ensaio validados.
- Documentados contrato observado, privacidade, limites da integração e verificações pendentes no README. Nenhuma migração de banco ou dependência de produção adicionada.
