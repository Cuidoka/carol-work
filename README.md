# SETLIST

Organizador local de repertórios musicais. Projeto acadêmico para apresentação em **16/11/2026**.

**Duas versões:** esta raiz contém a versão local validada, com SQLite em arquivo e sem dependências externas. A [pasta vercel/](vercel/README.md) contém a versão separada preparada para Vercel + Neon/PostgreSQL, conforme a escolha posterior do usuário. Os dados são independentes; veja o README dessa pasta para configurar e validar o deploy.

## Executar

Requer **Node.js >= 22.13.0** (a implementação foi testada com 24.22.1). Não há dependências npm externas nem etapa de build.

Na pasta do projeto:

```powershell
node server.js
```

Abra **http://localhost:3000**. Mantenha o terminal aberto; use `Ctrl+C` para parar. Se tiver npm disponível, `npm start` é equivalente. Para observar mudanças: `node --watch server.js` ou `npm run dev`.

Se `node` não for reconhecido, instale o Node.js que atenda ao requisito e reabra o terminal. Se a porta estiver ocupada, use no PowerShell:

```powershell
$env:PORT = '3002'
node server.js
```

Nesse caso, abra `http://localhost:3002`. O servidor aceita conexões somente da própria máquina (`127.0.0.1`).

## Usar

1. Em **Biblioteca musical**, clique em **Nova música**. Informe título, artista e duração em `MM:SS` (ex.: `03:45`).
2. Edite pelo ícone de lápis ou exclua pelo ícone de lixeira, com confirmação.
3. Em **Meus repertórios**, clique em **Nova setlist**. O evento/local é opcional.
4. Selecione a setlist, escolha músicas da biblioteca e clique em **Adicionar**.
5. Use as setas para mudar a ordem e `×` para remover apenas o vínculo. A música permanece na biblioteca.
6. A quantidade e a duração total são atualizadas após as operações. Uma faixa pode estar em vários repertórios, uma vez em cada um.

Excluir uma música remove seus vínculos em todos os repertórios. Excluir uma setlist preserva as músicas da biblioteca.

## Banco e dados

O banco `dados/setlist.sqlite` é criado automaticamente. Um banco novo recebe **5 músicas fictícias e 1 setlist com 3 faixas**. Os exemplos não reaparecem ao apagar os registros e reiniciar. Para criar um banco vazio, defina `SETLIST_SEED=0` **antes da primeira execução**.

O banco é ignorado pelo Git. **Não apague o arquivo para testar.** Para uma cópia de segurança simples, pare o servidor e copie `dados/setlist.sqlite` para outro local. Para restaurar, pare o servidor antes de substituir o arquivo pela cópia.

## Testes

```powershell
node --test
```

Ou `npm test`, se npm estiver disponível. Os testes usam arquivos SQLite temporários e portas livres; não alteram o banco da demonstração. Cobrem CRUD, vínculo N:N, FK/cascata, duplicidade, reordenação, JOIN, COUNT/SUM, dados inválidos e persistência ao fechar/reabrir banco e servidor.

Para testar a interface em outro banco, em um novo terminal PowerShell:

```powershell
$env:PORT = '3001'
$env:SETLIST_DB_PATH = Join-Path $env:TEMP 'setlist-interface.sqlite'
node server.js
```

Abra `http://localhost:3001`. As variáveis valem para esse terminal. Não use um banco de dados importante como banco de teste.

## Demonstrar as consultas SQL

Depois de executar a aplicação pelo menos uma vez:

```powershell
node database/consultar.js
```

Esse comando lê o banco, executa o arquivo `database/consultas.sql` e mostra três tabelas no terminal, sem modificar dados:

- **JOIN:** repertório, posição, música, artista e duração.
- **COUNT/SUM:** quantidade de músicas e duração em segundos por repertório, incluindo os vazios.
- **COUNT:** total de músicas cadastradas.

## Estrutura e requisitos

```text
server.js              API HTTP, validações e acesso SQLite
public/                HTML, CSS e JavaScript da interface
database/schema.sql    três tabelas com PK, FK, CHECK e UNIQUE
database/consultas.sql JOIN e agregações exigidas
database/consultar.js  demonstração das consultas em modo de leitura
dados/                 banco local (não versionado)
tests/                 testes com banco descartável
docs/                  escopo, arquitetura, roteiro e histórico
```

**Integração:** a interface chama a API por `fetch`; a API usa SQL parametrizado no SQLite. O modelo N:N usa `setlists` → `setlist_musicas` ← `musicas`, com FKs habilitadas e `ON DELETE CASCADE`.

O contrato completo das rotas está em [docs/02_ARQUITETURA_BANCO_E_API.md](docs/02_ARQUITETURA_BANCO_E_API.md). As regras de trabalho estão em [AGENTS.md](AGENTS.md).

## Roteiro de apresentação (4–6 minutos)

1. Apresente o problema e a arquitetura navegador → Node.js → SQLite.
2. Mostre as três tabelas, PK/FK e o relacionamento N:N em `database/schema.sql`.
3. Cadastre uma música com `03:20`; edite para `04:10`. Cadastre outra com `03:15`.
4. Crie uma setlist, adicione as duas músicas e mostre **07:25** (445 segundos).
5. Mude a ordem, recarregue a página e mostre que os dados continuam salvos. Reinicie o servidor para evidenciar persistência em disco.
6. Execute `node database/consultar.js` e explique JOIN, COUNT, SUM e COALESCE.
7. Remova uma faixa só do repertório e confira que continua na biblioteca. Demonstre as exclusões usando apenas registros de teste.

Limites: uso local, sem login, áudio, serviços externos ou hospedagem. A inspeção visual foi feita no navegador integrado, em larguras de celular e desktop; o ensaio na máquina e no navegador da apresentação ainda é necessário. Evidências detalhadas: [docs/04_HISTORICO_E_DECISOES.md](docs/04_HISTORICO_E_DECISOES.md).
