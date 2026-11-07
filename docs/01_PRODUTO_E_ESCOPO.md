# SETLIST — Especificação funcional e escopo acadêmico

## 1. Identidade do projeto

**Nome:** SETLIST  
**Descrição curta:** um organizador de repertórios para músicos e bandas.  
**Proposta de valor:** reunir músicas em uma biblioteca, criar repertórios de apresentações, organizar sua ordem e ver imediatamente a duração total de cada show.

### Problema que resolve

Montar a sequência de músicas para uma apresentação manualmente pode causar confusão de ordem, repetição de faixas e erros ao calcular quanto tempo o repertório ocupará. O SETLIST centraliza esse processo em um aplicativo simples.

### Usuário-alvo do protótipo

Uma pessoa que organiza o repertório de um show: estudante de música, músico solo, banda ou responsável pela apresentação. **Não há contas nem distinção de permissões no escopo acadêmico.**

### Objetivo do trabalho

Demonstrar os conhecimentos de modelagem relacional, CRUD, consultas SQL e integração entre interface, servidor e banco de dados. O aplicativo **não precisa** ter os recursos de uma plataforma profissional.

## 2. Enunciado oficial fornecido pelo usuário

- Criar e estruturar **pelo menos duas tabelas relacionadas**, com chaves primárias e estrangeiras quando necessário.
- Implementar **CRUD completo**: cadastro, consulta, atualização e exclusão de registros.
- Criar **uma consulta SQL com JOIN**.
- Criar **uma consulta SQL com subconsulta OU função de agregação**, por exemplo `COUNT`, `SUM` ou `AVG`.
- Conectar banco de dados ao **front-end e ao back-end** de maneira que as operações funcionem de verdade.
- Formato do grupo: individual, dupla ou trio.
- Apresentação: **16/11/2026**. Valor indicado: **3,0 pontos**.

**Interpretação adotada:** a implementação mínima precisa ser funcional nos itens acima, mas não precisa estar completa como produto pronto para mercado. Não afirmar que uma tela simulada ou dados só em memória cumprem a exigência de integração real.

## 3. Escopo obrigatório (MVP)

### RF-01 — Cadastrar música

O usuário informa título, artista/banda e duração, por exemplo `03:45`. O sistema converte a duração para segundos e salva no banco. Campos obrigatórios: título, artista e duração válida.

**Aceite:** após salvar, a música aparece na biblioteca e pode ser consultada novamente.

### RF-02 — Consultar músicas

Exibir a biblioteca de músicas com título, artista, duração e ações. Busca por título ou artista é um recurso simples já presente no código-base, mas não é exigência específica da professora.

**Aceite:** os dados exibidos vêm da API e do SQLite.

### RF-03 — Atualizar música

Permitir alteração de título, artista e duração.

**Aceite:** os novos valores persistem ao recarregar a página.

### RF-04 — Excluir música

Permitir excluir uma música com confirmação. Se ela estiver em repertórios, seus vínculos são removidos de acordo com a integridade referencial do banco.

**Aceite:** a música desaparece da biblioteca e dos repertórios vinculados; outras músicas permanecem.

### RF-05 — Criar, consultar, editar e excluir setlists

Uma setlist representa um repertório de apresentação. Campos: nome obrigatório e evento/local opcional. Deve haver uma lista de setlists e uma visualização dos detalhes da selecionada.

**Aceite:** as quatro operações funcionam e persistem no banco.

### RF-06 — Adicionar e remover músicas de uma setlist

Selecionar músicas já cadastradas e vinculá-las a uma setlist. Uma mesma música pode fazer parte de vários repertórios, mas **não pode ser cadastrada duas vezes no mesmo repertório** nesta versão. Remover a música de um repertório não a exclui da biblioteca.

**Aceite:** a associação é salva, recuperada e removida sem afetar outras setlists.

### RF-07 — Definir ordem das músicas

Exibir músicas da setlist em uma sequência de apresentação e permitir mover uma faixa para cima ou para baixo.

**Aceite:** a nova ordem é recuperada após recarregar a página.

### RF-08 — Calcular duração do repertório

Somar os segundos das músicas incluídas em cada setlist, exibindo o valor em formato legível. Uma setlist vazia tem duração total zero.

**Aceite:** quando uma música é incluída, removida ou tem sua duração alterada, a soma muda corretamente.

### RF-09 — Consultas SQL demonstráveis

- Uma consulta `JOIN` relacionando repertórios e músicas.
- Uma consulta com `COUNT` e `SUM` mostrando quantidade de músicas e duração total por setlist.

**Aceite:** as consultas estão em `database/consultas.sql` e/ou no backend, e seus resultados podem ser explicados na apresentação.

## 4. Telas e navegação

**Tela A — Meus repertórios**

- Lista de setlists criadas.
- Botão "Nova setlist".
- Detalhes da setlist selecionada: nome, evento, quantidade, duração e músicas ordenadas.
- Botões editar e excluir repertório.
- Seletor para adicionar músicas e controles de ordem/remover vínculo.

**Tela B — Biblioteca musical**

- Lista de músicas com título, artista e duração.
- Botão "Nova música".
- Ações de editar e excluir.
- Busca simples, se já estiver presente.

**Formulários/modal**

Um mesmo modal pode servir tanto para criar quanto para editar registros. Não é necessário implementar páginas adicionais para cada ação.

## 5. Regras de negócio e dados

- RN-01: título e artista da música não podem ser vazios.
- RN-02: duração é armazenada como **inteiro de segundos**; a interface pode receber `MM:SS`. No código atual, valores aceitos vão de **1 a 36.000 segundos**.
- RN-03: nome da setlist não pode ser vazio.
- RN-04: evento/local é opcional; não é obrigatório criar uma tabela separada para eventos.
- RN-05: uma música pode ser reutilizada em setlists distintas.
- RN-06: uma música não pode ocorrer duas vezes na mesma setlist na versão atual (restrição `UNIQUE`).
- RN-07: excluir uma setlist deve excluir apenas seus vínculos; não excluir músicas da biblioteca.
- RN-08: excluir uma música deve excluir seus vínculos; não excluir setlists.
- RN-09: as listas e durações exibidas devem refletir o banco após cada operação.
- RN-10: dados fictícios são aceitáveis para a demonstração, desde que estejam persistidos no banco e não sejam usados para simular CRUD inexistente.

## 6. O que NÃO será desenvolvido

Fora do escopo, salvo decisão explícita posterior:

- Login, cadastro de usuários, perfis, permissões ou segurança para publicação pública.
- Streaming/reprodução de músicas, upload MP3/WAV, player de áudio, gravação ou edição sonora.
- Integrações com Spotify, YouTube, Apple Music ou serviços pagos.
- IA, recomendações automáticas ou geração de repertórios.
- Aplicativo mobile nativo, hospedagem em nuvem ou sincronização entre dispositivos.
- Gestão comercial de ingressos, cachês, contratos, equipes ou calendário completo de eventos.
- Design elaborado que comprometa o prazo ou coloque os requisitos básicos em risco.

## 7. Matriz de rastreabilidade: critério da professora → evidência

| Critério | Evidência mínima | Onde encontrar no projeto atual |
|---|---|---|
| 2+ tabelas relacionadas | `musicas`, `setlists`, `setlist_musicas` | `database/schema.sql` |
| PK e FK | `id` e referências `setlist_id`/`musica_id` | `database/schema.sql` |
| CREATE | Criar música e/ou setlist | formulário + endpoints `POST` |
| READ | Listar músicas e repertórios | telas + endpoints `GET` |
| UPDATE | Editar música e/ou setlist | formulário + endpoints `PUT` |
| DELETE | Excluir música e/ou setlist | interface + endpoints `DELETE` |
| JOIN | Relacionar repertórios, itens e músicas | `database/consultas.sql` |
| Agregação | `COUNT` e `SUM` por setlist | `database/consultas.sql` e `GET /api/setlists` |
| Integração | React chama API que consulta/grava SQLite | `src/lib/api.mjs` / `src/hooks/useSetlistData.js` → `server.js` → SQLite |
| Persistência | registro permanece após reinício | demonstração manual |

## 8. Critério de conclusão

O projeto está **apto à apresentação acadêmica** quando todos os critérios do enunciado puderem ser demonstrados ao vivo e os testes mínimos do documento 03 passarem. Recursos fora do escopo não impedem a conclusão. Correções pontuais de bugs ainda poderão ser feitas antes da apresentação.
