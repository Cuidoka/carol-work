# SETLIST — Catálogos e importação de material pronto

## Pedido e resultado

Em 14/11/2026, o usuário pediu cifras prontas, principalmente do Cifra Club, pesquisa de Letras e outras fontes, e duração de catálogo para músicas conhecidas. A entrada manual continua disponível para músicas autorais. Não houve troca de stack nem adição de dependências npm.

**Publicado e validado:** [SETLIST na Vercel](https://carol-work.vercel.app/), com 34 testes de regressão, smoke público e importação/gravação/refresh/ensaio exercitados no navegador. iTunes, MusicBrainz e LRCLIB responderam HTTP 200 pela função publicada. A falha inicial do carregador ESM foi corrigida; detalhes e limites no histórico. Dados do usuário preservados e testes removidos.

| Informação | Método implementado | Revisão |
|---|---|---|
| Duração | API pública Apple/iTunes; alternativa MusicBrainz | Escolher a gravação preenche duração e fonte |
| Letra | API LRCLIB existente | Selecionar prévia e usar; preenche duração se ainda vazia |
| Cifra pronta | Colar conteúdo copiado no site; importar TXT ou HTML com `pre` | Prévia explícita, depois Usar esta cifra |
| Localizar material | Buscas do Cifra Club e Letras em nova aba | Usuário escolhe o resultado/versão |
| Música autoral | Edição manual dos campos atuais | Salvar música |

**Limite importante:** não existe integração oficial Cifra Club/Letras habilitada neste projeto. Não foi localizada uma API pública documentada deles na pesquisa. O servidor recebeu 403; não foi instalado scraping via proxy, CAPTCHA solver ou API privada. A importação por link sem copiar/selecionar arquivo não foi implementada. Cifra pronta não significa acordes gerados nem transposição automática.

## Como usar

1. Nova música → informar título e artista.
2. Buscar duração → conferir artista/álbum/versão → Usar duração. Para composição autoral, preencher manualmente.
3. Letra e cifra → Buscar no Cifra Club ou Letras → escolher a página e copiar apenas o material desejado.
4. Colar em Cifra copiada, informar opcionalmente a URL → Revisar cifra colada → Usar esta cifra. Também pode selecionar TXT ou HTML salvo com bloco `pre`.
5. Buscar letra no LRCLIB se necessário. Esse catálogo não fornece acordes.
6. Revisar e Salvar música. Cancelar descarta o rascunho; as buscas não cadastram faixas.

Texto deve ter até 20.000 caracteres. Arquivos até 2 MB, extensões TXT/HTML/HTM, em UTF-8. HTML sem `pre` recebe instrução de copiar como texto; PDF, imagens e extração OCR não são suportados. Não se deve colar a página inteira com menus e anúncios.

## Pesquisa realmente executada

- Apple/iTunes: HTTP 200; `trackTimeMillis` convertido para segundos. Tempo Perdido/Legião Urbana retornou versão de 302 s, além de versões ao vivo com outros tempos.
- MusicBrainz: HTTP 200 na chamada direta; 11 gravações válidas, primeira com 300 s. Uma chamada posterior pela interface recebeu indisponibilidade (503), tratada sem apagar dados. Disponibilidade externa não é garantida.
- LRCLIB: busca real pela interface, prévia de 763 caracteres, importação e preenchimento de 05:02; cancelada sem salvar a letra no banco principal.
- Cifra Club: requisição Node à página pública recebeu 403/Akamai; navegação normal funcionou. Busca do site localizou a faixa; conteúdo do `pre` tinha 4.188 caracteres. Importação por colagem mostrou 4.187 após normalizar quebra externa; confirmação preencheu o rascunho. Cancelar preservou biblioteca vazia. Tentativa do botão Baixar cifra não gerou download observado; não é considerada teste aprovado de exportação.
- Letras: requisição Node recebeu 403; busca no navegador funcionou. O endereço exige hash `gsc.q`, corrigido após verificar a navegação real.
- Cifras.com.br e E-Chords: requisição Node recebeu 403/Cloudflare. Vagalume: documentação retornou 503. Não foram adotados como APIs funcionais. MusicBrainz e iTunes dispensam credenciais para as consultas implementadas.

## Implementação

`GET /api/catalogo?titulo=...&artista=...&catalogo=itunes|musicbrainz` existe nos dois back-ends, usando `lib/catalog.cjs`. Só consulta hosts fixos, timeout de 10 s, sem redirecionamentos; limita versões e valida duração entre 1 e 36.000 s. Cache em memória de 3 minutos, até 40 buscas, intervalo mínimo por processo e respeito a Retry-After. O intervalo não é um limite distribuído entre instâncias da Vercel.

`cifra_fonte` e `duracao_fonte` são colunas TEXT opcionais, default vazio, até 500 caracteres. Migração aditiva/idempotente, preservando modelo N:N. PUTs que omitem as fontes mantêm valores anteriores. Links HTTPS de hosts permitidos, sem credenciais, validados; são referências, nunca URLs arbitrárias buscadas pelo servidor. Alterar duração manualmente limpa sua fonte no formulário.

HTML é analisado em template desconectado, sem inserir conteúdo no documento. Scripts, iframes e elementos executáveis são removidos. O bloco textual vira string e é exibido pelo React, mantendo espaços. Prévia não grava nada; apenas o POST/PUT de Salvar persiste. A importação tenta aproveitar título/artista/canonical do HTML sem substituir dados já digitados.

## Fontes da pesquisa

- [Apple: Search API e condições dos recursos promocionais](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/). O SETLIST usa metadados, sem capas, previews ou streaming.
- [Apple: campos retornados, incluindo trackTimeMillis](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/UnderstandingSearchResults.html).
- [MusicBrainz: API](https://musicbrainz.org/doc/MusicBrainz_API), [limites e identificação](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).
- [LRCLIB: API](https://lrclib.net/docs).
- [Cifra Club: página pública consultada](https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/), [termos](https://www.cifraclub.com.br/aviso-legal.html?hl=pt).
- [Vagalume: documentação indisponível durante a pesquisa](https://api.vagalume.com.br/docs/).

Testes e publicação têm evidências no histórico. Letras/cifras reais não são fixtures versionadas nem capturas de entrega; exemplos de teste são autorais.
