# SETLIST — Plano de trabalho, testes e apresentação

## 1. Estratégia

**Atualização React/Tailwind — 07/11/2026:** após a conversão autorizada, instale com `npm ci` na raiz. `npm start` compila e executa a versão local; `npm run dev` abre o desenvolvimento Vite em 5173 com proxy para a API. `npm run test:all` compila e executa as suítes SQLite e PostgreSQL/PGlite. Os cenários de aceitação abaixo continuam válidos. Para testar com comandos diretos do Node, compile primeiro com `npm run build`.

**Entrega mínima antes de qualquer melhoria visual:** funcionar o CRUD, a ligação entre as três tabelas, pelo menos um JOIN, uma agregação SQL e a persistência real dos dados. Na auditoria de 01/11/2026 não havia código na pasta. O usuário confirmou e autorizou a primeira implementação. Os itens abaixo são um roteiro; as evidências de execução estão no histórico, sem presumir que toda a matriz já foi testada visualmente.

### Etapa 0 — Inspecionar e diagnosticar (prioridade máxima)

- [ ] Ler `AGENTS.md` e toda a pasta `docs/`.
- [ ] Ler `README.md`, `package.json`, `server.js`, front-end e SQL.
- [ ] Identificar funcionalidades existentes, limitações e diferenças em relação à documentação.
- [ ] Executar `node --version`, confirmar compatibilidade e iniciar o servidor.
- [ ] Verificar o navegador e o fluxo real front-end → API → SQLite.
- [ ] Fazer uma lista curta de falhas com gravidade e evidência reproduzível.
- [ ] Registrar diagnóstico em `docs/04_HISTORICO_E_DECISOES.md`.

### Etapa 1 — Garantir os requisitos obrigatórios

- [ ] Validar relacionamentos, PK, FK, `ON DELETE CASCADE` e restrição de duplicidade.
- [ ] Testar criar, consultar, editar e excluir músicas.
- [ ] Testar criar, consultar, editar e excluir setlists.
- [ ] Testar incluir/remover faixas de uma setlist e alterar ordem.
- [ ] Executar a consulta `JOIN` no banco e explicar seu resultado.
- [ ] Executar a consulta `COUNT` + `SUM` e explicar seu resultado.
- [ ] Confirmar persistência após reiniciar o servidor.

### Etapa 2 — Corrigir defeitos, se encontrados

- [ ] Priorizar bloqueios que impeçam a apresentação.
- [ ] Corrigir apenas o necessário para os fluxos exigidos.
- [ ] Após cada correção, testar o fluxo afetado e um caso relacionado.
- [ ] Evitar adicionar bibliotecas e trocar arquitetura sem necessidade.

### Etapa 3 — Preparar entrega

- [ ] Revisar instruções de instalação/execução no `README.md`.
- [ ] Conferir que SQL de exemplo corresponde ao esquema atual.
- [ ] Conferir se os formulários e botões têm resposta compreensível.
- [ ] Preparar alguns dados fictícios não sensíveis para demonstração.
- [ ] Ter cópia do repositório e uma forma de iniciar o servidor localmente.
- [ ] Ensaiar apresentação seguindo a sequência da seção 5.

### Etapa 4 — Melhorias opcionais (somente se sobrar tempo)

Refino responsivo, pequenos ajustes de textos, mensagens melhores para erros, renumeração de `posicao` após remoção, testes automatizados. **Nenhuma dessas melhorias deve substituir a implementação dos itens obrigatórios.**

## 2. Matriz de testes de aceitação

Os testes devem ser feitos em uma **cópia do projeto ou banco descartável**, para não destruir dados importantes.

| ID | Procedimento | Resultado esperado | Evidência |
|---|---|---|---|
| T01 | Inicializar `npm start` | Servidor responde em `localhost:3000` e cria/abre SQLite | Terminal + tela inicial |
| T02 | Cadastrar música “Teste 01”, artista “Banda A”, 03:20 | Nova linha salva e listada | Interface + banco |
| T03 | Atualizar “Teste 01” para 04:10 | Nova duração visível mesmo após refresh | Interface + banco |
| T04 | Criar setlist “Apresentação Teste” | Repertório aparece na lista | Interface |
| T05 | Adicionar duas músicas à setlist | Ambas aparecem no detalhe | Interface + vínculo SQLite |
| T06 | Tentar adicionar mesma música novamente | Sistema impede duplicidade | Mensagem de erro |
| T07 | Reordenar as duas músicas | Nova ordem permanece após refresh | Interface + banco |
| T08 | Confirmar soma das durações: 04:10 + 03:15 | Total = **07:25** (445 segundos) | Interface + SUM SQL |
| T09 | Remover uma música apenas da setlist | Sai do repertório, continua na biblioteca | Interface |
| T10 | Excluir uma música da biblioteca | Sai da biblioteca e dos vínculos relacionados | Interface + FK |
| T11 | Editar nome/evento da setlist | Valores atualizam e persistem | Interface |
| T12 | Executar consulta `JOIN` | Retorna setlist, faixa, artista e posição corretos | Resultado SQL |
| T13 | Executar consulta `COUNT`/`SUM` | Números conferem com as músicas associadas | Resultado SQL |
| T14 | Reiniciar servidor e atualizar navegador | Dados cadastrados seguem presentes | Persistência |
| T15 | Excluir a setlist de teste | Setlist removida, músicas da biblioteca preservadas | Interface + FK |
| T16 | Enviar dados inválidos (ex.: duração 0) | API recusa com erro, sem corromper banco | Resposta HTTP |
| T17 | Abrir página e executar as operações em navegador | Componentes exibem e acionam APIs corretamente | Navegador |

**Notas:** para T08, cadastre uma segunda música com duração `03:15` e use a música atualizada para `04:10`. O valor 07:25 é cálculo de referência; não depende dos dados fictícios incluídos por padrão.

### 2.1 Testes HTTP rápidos

Com servidor rodando, é possível testar as rotas com o terminal ou com Postman/Insomnia. Exemplo usando `curl`:

```bash
curl http://localhost:3000/api/musicas
```

```bash
curl -X POST http://localhost:3000/api/musicas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Teste 01","artista":"Banda A","duracao_segundos":200}'
```

No Windows PowerShell, o apelido `curl` pode ter comportamento diferente; prefira `curl.exe` ou `Invoke-RestMethod` se necessário.

### 2.2 Executar consultas SQL sem ferramenta externa

O SQLite é aberto pelo próprio Node. Execute `node database/consultar.js` para mostrar as consultas de `database/consultas.sql`. O script abre o banco em modo somente leitura. Para consultar uma cópia, defina `SETLIST_DB_PATH` no terminal; um visualizador SQLite também pode ser usado.

Não edite `dados/setlist.sqlite` diretamente enquanto o servidor estiver operando sem avaliar o risco de conflito de escrita. Para apresentação, basta mostrar SQL + resultados obtidos pelo aplicativo, ou executar o SQL em ferramenta de banco usando cópia apropriada.

## 3. Política de defeitos e prioridades

**P0 — bloqueia entrega:** servidor não inicia, banco não cria/abre, CRUD não salva, FK inconsistente, JOIN/agregação inexistentes, front-end não acessa a API.

**P1 — prejudica demonstração:** modal não salva, exclusão falha, cálculo errado, links quebrados, erros no navegador que impedem o fluxo principal.

**P2 — melhora qualidade:** interface em telas pequenas, textos, estilo, mensagens, organização da documentação.

**P3 — fora do escopo:** contas, streaming, áudio, IA, APIs externas, hospedagem ou funcionalidades comerciais.

Implementar na sequência **P0 → P1 → P2**, ignorando P3 salvo pedido explícito.

## 4. Cronograma sugerido para a apresentação de 16/11/2026

| Período | Entrega desejada |
|---|---|
| 01–03/11 | Auditoria do repositório e execução local |
| 04–07/11 | Validar/corrigir CRUD e relacionamentos |
| 08–10/11 | Validar/corrigir interface, duração e consultas SQL |
| 11–13/11 | Rodar matriz de testes e corrigir problemas críticos |
| 14–15/11 | Preparar dados fictícios, revisar arquivos e ensaiar |
| 16/11 | Apresentar o MVP funcionando |

As datas são um plano de trabalho, não uma garantia de execução automática nem um compromisso de trabalho em segundo plano.

## 5. Roteiro de apresentação (aproximadamente 4–6 minutos)

1. **Problema (30 s):** montar a ordem das músicas e somar a duração de um show manualmente pode gerar erros; o SETLIST centraliza isso.
2. **Arquitetura (30 s):** HTML/CSS/JS chamam a API Node.js; o servidor grava e consulta SQLite.
3. **Tabelas (40 s):** apresentar `musicas`, `setlists` e `setlist_musicas`; mostrar PK, FK e relação N:N.
4. **CRUD (90 s):** cadastrar música, listar, editar e excluir uma música de teste; mencionar que setlists também possuem CRUD.
5. **Relacionamento (60 s):** criar uma setlist, adicionar duas faixas e alterar sua ordem.
6. **SQL e cálculo (60 s):** mostrar `JOIN` e `COUNT/SUM`, explicando como surgem a quantidade e a duração total na tela.
7. **Persistência (30 s):** atualizar a página, mostrar que o dado permanece salvo e encerrar.

O tempo é uma estimativa para ensaio. Ajustar conforme a duração que a professora disponibilizar.

## 6. Registro de evidências

Para cada alteração feita pelo Codex, manter em `docs/04_HISTORICO_E_DECISOES.md`:

- **Alteração:** o que mudou, em quais arquivos.
- **Motivo:** problema ou requisito atendido.
- **Teste:** comando/ação e resultado real, não presumido.
- **Pendências:** limitações ou pontos que precisam de decisão.

Se um teste não foi realizado, registrar **“não testado”** em vez de dizer que passou.
