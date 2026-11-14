# SETLIST — Evolução e qualidade até o fim de novembro

## Meta autorizada

Em 14/11/2026, o usuário atualizou o prazo para o fim de novembro e pediu um site bem acabado, clean, com transições e hovers discretos e funcionalidades úteis para músicos. Confirmou a inclusão de busca externa de letras. A implementação foi concluída e validada localmente e na URL pública em 14/11/2026; este documento registra o escopo verificável no repositório.

Os requisitos acadêmicos continuam obrigatórios. Não ampliar para contas, áudio ou streaming. Em pedido posterior no mesmo dia, o usuário autorizou pesquisar integração de cifras prontas e duração automática; o resultado e os limites estão em `07_CATALOGOS_E_IMPORTACAO.md`. A entrega atual usa colagem/arquivo para cifras, sem contornar bloqueios dos provedores.

## Entrega implementada

| Recurso | Comportamento esperado | Evidência necessária |
|---|---|---|
| Acabamento | Entradas curtas, hover de botões/cards/linhas, foco visível, movimento reduzido | Build e inspeção no navegador/CSS |
| Material da música | Salvar/editar/limpar letra, cifra, tom e notas | API, banco, refresh e formulário |
| Busca de letras | Consultar por título/artista; listar versões; prévia e importação explícita; fonte | Consulta real e fluxo no navegador |
| Falhas externas | Erro compreensível, sem apagar material ou bloquear edição manual | Testes de catálogo vazio, falha, resposta inválida e 429 |
| Modo de ensaio | Ler letra/cifra na ordem, mudar fonte, navegar por botões/teclado, rolar/pausar | Navegador com repertório real de teste |
| Descoberta | Identificar faixas com material e filtrar biblioteca | Navegador |
| Dados anteriores | Migração repetível sem recriar entidades; manter IDs/vínculos | SQLite antigo e PostgreSQL/PGlite antigo em bancos descartáveis |
| Base acadêmica | CRUD, FK, JOIN, COUNT/SUM, ordem, cascatas e persistência preservados | `npm run test:all` e fluxos locais |

## Decisões

- Preservar a identidade verde/escura, os componentes React/Tailwind e os dois back-ends. Sem novas dependências npm para animação ou conteúdo.
- Guardar material na própria música, pois letra/cifra/tom/notas pertencem à faixa e são reutilizados em repertórios. Não há mudança de cardinalidade ou quarta tabela desnecessária.
- Busca por ação explícita, sem varrer a biblioteca automaticamente. LRCLIB é um catálogo de letras, com cobertura e disponibilidade variáveis. Não garante a versão correta: o usuário revisa antes de importar. Não fornece cifras.
- Cifra em texto monoespaçado conserva alinhamento; em telas estreitas, permite rolar dentro do leitor. Letra pode quebrar linha. Não há transposição automática de acordes nesta entrega.
- A rolagem só inicia por ação do usuário. Fonte, aba e posição de leitura são estado transitório, não conteúdo a gravar no banco.
- Acesso ao catálogo somente por host fixo no servidor, com identificação SETLIST, timeout e respeito a Retry-After. Não são enviadas notas, cifra ou dados do banco ao catálogo; apenas título/artista digitados na busca.
- Textos salvos são exibidos como texto React, inclusive caracteres que se parecem com HTML. Nenhum conteúdo do catálogo é executado como código.

## Atualização segura

1. Parar a instância principal e copiar o SQLite antes de atualizar uma biblioteca importante.
2. A versão local adiciona colunas ausentes em transação ao iniciar. Não apaga ou substitui dados.
3. No Neon, fazer backup/branch e reaplicar `vercel/database/schema.sql` antes do deploy novo. Não usar o schema SQLite no Neon.
4. Verificar na URL real a edição e persistência dos novos campos, além de busca, ensaio e CRUD.

## Conclusão verificada — 14/11/2026

**Publicado:** https://carol-work.vercel.app/ — Vercel + Neon real, projeto SETLIST separado. A conexão que causava 503 foi corrigida; as novas funcionalidades estão disponíveis.

| Critério | Resultado observado |
|---|---|
| Transições/hovers | CSS compilado e hover real do card no site, com deslocamento de 2 px e sombra; desktop e celular conferidos |
| Letra/cifra/tom/notas | Cadastro/edição/leitura no smoke remoto; formulário e leitura após refresh no navegador público |
| Busca de letras | 8 opções pela Vercel; prévia e importação de 763 caracteres pela interface; cancelamento sem gravar |
| Falhas do catálogo | Testes controlados de vazio, falha, resposta inválida e 429; API/edição manual independentes |
| Ensaio | Cifra/letra, fonte, sequência e início acumulado no site; rolar/pausar e teclado testados localmente |
| Filtros | Biblioteca pública com filtro Com cifra retornando a faixa correta |
| Preservação | Migrações antigas em SQLite/PGlite; Neon separado, schema testado em branch antes de main; SQLite e projeto Neon anterior preservados |
| Requisitos acadêmicos | 28 testes de regressão, smoke no Neon real e smoke pela URL pública, incluindo CRUD, JOIN, COUNT/SUM, FKs e cascatas |
| Entrega | Commit f02fa75 enviado ao GitHub; deployment READY observado; credenciais ignoradas e arquivos privados 404 |

Registros e branch de teste foram removidos. A biblioteca online começa vazia, pronta para os dados do usuário. Capturas e detalhes completos no histórico.

O plano previa implementação até 20/11, validação online até 26/11 e revisão final até 30/11. As etapas de software foram antecipadas e verificadas em 14/11. Ensaiar a apresentação permanece uma atividade do aluno. Não há execução automática agendada para essas datas.

**Limites da evidência:** um navegador; sem carga/múltiplos usuários ou auditoria WCAG completa. Movimento reduzido conferido no CSS, sem emulação do SO. Exclusões públicas testadas por API e interface de exclusão testada localmente. O escopo segue sem contas de usuário; visitantes compartilham o banco.

Referência consultada: [API oficial LRCLIB](https://lrclib.net/docs). Sem API key para a consulta anônima implementada. Não publicar letras de teste em documentos ou capturas de entrega: as capturas usam texto próprio.
