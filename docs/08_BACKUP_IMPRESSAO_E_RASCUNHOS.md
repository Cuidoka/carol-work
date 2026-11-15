# SETLIST — Backup, impressão e rascunhos

## Escopo autorizado em 15/11/2026

Usuário escolheu três melhorias: backup/restauração, impressão/PDF e aviso de alterações não salvas. Preservadas stack, três tabelas e dados existentes. Nenhuma dependência npm ou migração nova.

## Backup

- Botão Backup disponível no cabeçalho após carregar os dados.
- Download JSON com `formato: "setlist-backup"`, `versao: 1`, `exportado_em`, `musicas` e `setlists`. As músicas incluem material/fontes; cada repertório tem `musica_ids` na ordem de execução. O mesmo ID pode aparecer em repertórios distintos, mantendo N:N.
- GET usa transação para snapshot consistente, sem dados de configuração/credenciais. Apenas campos conhecidos são exportados.
- Selecionar arquivo chama validação de formato, textos/fontes, limites, IDs únicos, duração, referências e ausência de duplicata no mesmo repertório. Prévia mostra quantidades e não grava.
- Confirmar restauração executa uma transação: gera novos IDs, inclui material/repertórios e reconstrói vínculos. Falha provoca rollback. Dados anteriores são preservados. Importar o mesmo arquivo duas vezes cria cópias; não existe deduplicação por título/artista nem sobrescrita.
- IDs originais e datas de criação não são restaurados literalmente. A ordem relativa é preservada, com posições sequenciais novas. É backup lógico dos dados do aplicativo, não cópia física do SQLite.
- Limites: JSON UTF-8 até 4 MB, até 1.000 músicas, 200 repertórios e 10.000 vínculos. Outros endpoints continuam limitados a 256 KB. Bibliotecas maiores recebem erro claro; não há fragmentação de arquivos nesta entrega.

## Impressão/PDF

O repertório selecionado recebe Imprimir / PDF, que abre window.print. `PrintSetlist.jsx` gera folha separada, exibida só por CSS de impressão: A4, nome/evento, número/ordem, música/artista, tom, duração, início acumulado, notas e URL de cifra validada. A navegação e botões do aplicativo não fazem parte da folha. Campos de texto são escapados pelo React. Letra/cifra de páginas externas não é baixada para o PDF.

O usuário escolhe Salvar como PDF na janela do navegador. Não existe endpoint de PDF binário; não foi adicionada biblioteca ou serviço externo. O suporte à impressão é do navegador utilizado.

## Rascunhos

O editor compara campos atuais com os valores ao abrir o formulário. Alteração de metadados, material, link ou cifra ainda no painel de importação ativa proteção. Cancelar, fechar e Escape abrem confirmação com Continuar editando focado por padrão. Confirmar descarte fecha sem gravar; continuar mantém o estado. Formulário sem mudanças fecha direto; salvar com sucesso fecha normalmente.

beforeunload só fica registrado enquanto houver edição pendente. O navegador controla a exibição e o texto do aviso ao sair/recarregar; não é salvamento automático. Diálogos receberam IDs únicos para permitir confirmação acessível sobre o editor sem desmontar o rascunho.

## Verificação

Resultados, evidências de interface e publicação no histórico. A automação da janela nativa do navegador foi interrompida por verificação de segurança da URL. **O arquivo PDF final salvo pela janela de impressão e o aviso nativo de recarregamento não foram executados/validados nesta sessão.** A estrutura da folha foi renderizada em SSR com dados reais da API descartável, mas isso não substitui conferir o PDF salvo num navegador comum.
