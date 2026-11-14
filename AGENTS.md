# AGENTS.md — Regras de trabalho para o Codex no SETLIST

## Objetivo e autoridade

Você trabalha em **SETLIST**, um projeto acadêmico simples de organizador de repertórios musicais, com entrega até o **fim de novembro de 2026**, conforme atualização do usuário. A data anterior de apresentação era 16/11/2026. O objetivo é cumprir o enunciado: **duas ou mais tabelas relacionadas, PK/FK, CRUD completo, JOIN, agregação ou subconsulta, e integração real de front-end/back-end/banco de dados**. A necessidade de dar nota aos requisitos prevalece sobre ambição de produto.

Antes de tocar no código, leia `docs/00_COMECE_AQUI_CODEX.md`, `docs/01_PRODUTO_E_ESCOPO.md`, `docs/02_ARQUITETURA_BANCO_E_API.md`, `docs/03_ROTEIRO_IMPLEMENTACAO_E_TESTES.md` e `docs/04_HISTORICO_E_DECISOES.md`. Depois verifique o **código real**. Pergunte apenas sobre decisões que não podem ser resolvidas com segurança a partir do enunciado ou dos arquivos.

## Comportamento obrigatório

1. **Não invente fatos.** Distinga o que está no código, o que você testou, o que é inferência e o que ainda falta verificar.
2. **Não reescreva o projeto por padrão.** Identifique o que já existe; preserve funcionalidades atuais ao corrigir falhas.
3. **Não faça expansão de escopo** (login, IA, streaming, upload, Spotify, hospedagem, dashboards complexos) sem solicitação explícita.
4. **Não altere a stack sem motivo demonstrado.** Em 07/11/2026, o usuário autorizou converter todo o front-end para **React + Tailwind + Vite**. A interface única fica em `src/` e é compilada em `dist/`. O back-end local continua Node.js nativo + SQLite; o back-end online fica em `vercel/` e usa Neon/PostgreSQL. O projeto usa npm workspaces e um único `package-lock.json` na raiz. Preserve os requisitos acadêmicos ao alterar essa arquitetura.
   Em 14/11/2026, o usuário autorizou acabamento visual, letras/cifras, modo de ensaio e busca externa de letras com revisão. Consulte `docs/06_EVOLUCAO_E_QUALIDADE.md`.
5. **Não apague ou substitua dados reais.** O arquivo `dados/*.sqlite` pode conter registros importantes. Use cópias ou bancos temporários para testes destrutivos. Não versionar arquivos de banco.
6. **Preserve o modelo de dados** ou proponha migração explícita e segura; habilite as FKs e utilize SQL parametrizado.
7. **Após mudar comportamento, teste.** Na resposta, relate o comando, cenário e resultado observados; o que não for testado deve estar explícito.
8. **Atualize `docs/04_HISTORICO_E_DECISOES.md`** após mudanças significativas: problema, decisão, arquivos, testes e limitações. Não é necessário registrar cada tecla ou frase; registre fatos recuperáveis e úteis.
9. **Prefira alterações pequenas e reversíveis**, com foco na confiabilidade da apresentação.
10. **Não declare o trabalho concluído** se qualquer requisito obrigatório ainda não for demonstrável.

## Ordem de execução recomendada

- Fazer auditoria do estado atual e reportar evidências.
- Validar servidor, banco e rotas de CRUD.
- Validar JOIN, COUNT/SUM, FK e persistência.
- Testar a interface no navegador.
- Corrigir falhas impeditivas e atualizar documentação.
- Preparar demonstração acadêmica.

## Comunicação esperada

Em cada ciclo, informar brevemente:

- O que foi feito e por quê.
- Quais arquivos foram alterados.
- Qual teste foi realmente executado e o resultado.
- O que ainda falta e eventuais riscos.

Se houver contradição entre documentação e código, **relate a divergência** e escolha a correção menos invasiva, alinhada ao enunciado e às decisões explícitas do usuário.

## Definição de pronto

Pronto significa: aplicativo local inicializa, CRUD na interface persiste no SQLite, tabelas possuem PK/FK e relacionamento válido, JOIN e agregação funcionam, e o aluno pode demonstrar tudo em sala. Não é sinônimo de aplicativo profissional ou pronto para publicação pública.
