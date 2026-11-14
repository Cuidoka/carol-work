# SETLIST — Evolução e qualidade até o fim de novembro

## Meta autorizada

Em 14/11/2026, o usuário atualizou o prazo para o fim de novembro e pediu um site bem acabado, clean, com transições e hovers discretos e funcionalidades úteis para músicos. Confirmou a inclusão de busca externa de letras. A meta está ativa no chat e este documento registra o escopo verificável no repositório.

Os requisitos acadêmicos continuam obrigatórios. Não ampliar para contas, áudio, streaming ou integrações de cifras por scraping.

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

## Plano vigente

- 14–20/11: implementar e validar acabamento e fluxo completo de material/ensaio. As evidências já executadas estão no histórico.
- 21–26/11: validar no deploy real com Neon, resolver falhas observadas e recolher feedback visual do usuário.
- 27–30/11: revisão final de conteúdo, responsividade e ensaio da apresentação; congelar mudanças que coloquem a demonstração em risco.

As datas são um plano, não execução automática em segundo plano. O usuário forneceu `https://carol-work.vercel.app/`: o frontend abre, mas músicas/repertórios retornaram 503 no primeiro diagnóstico. Conexão Neon e publicação das mudanças novas ainda precisam de configuração/verificação. Uma suíte PGlite aprovada não comprova infraestrutura remota. Evidências e correção local do estado indisponível no histórico.

O usuário confirmou que ainda não conectou o Neon. As integrações de conta Vercel/Neon continuam sem conexão confirmada nesta conversa. A revisão local adicional corrigiu foco dos diálogos e bloqueio da rolagem de fundo; o avanço online depende de acesso autenticado e conexão do banco.

**Estado da meta após revalidação:** bloqueada na configuração/publicação/validação online. GETs das duas rotas de dados continuam retornando 503 e não há integração autenticada disponível. A implementação local foi preservada; a meta completa só poderá ser concluída após conexão do banco e validação da versão publicada. Retomar quando o usuário concluir a conexão ou disponibilizar acesso pelas integrações.

**Avanço posterior no acesso:** por solicitação do usuário, Neon CLI 9.5.0 foi instalado e autenticado via GitHub; plugin Codex neon-postgres 3.0.8 com skills/MCP instalado e habilitado. O CLI já permite operações autenticadas; o plugin precisa de reinício do agente e pode pedir consentimento OAuth próprio. Ainda é necessário criar/vincular o banco correto, configurar a Vercel e validar o deploy. Detalhes, backup e verificações no histórico.

Referência consultada: [API oficial LRCLIB](https://lrclib.net/docs). Sem API key para a consulta anônima implementada. Não publicar letras de teste em documentos ou capturas de entrega: as capturas usam texto próprio.
