-- JOIN: quais músicas pertencem a cada repertório e em qual ordem?
SELECT s.nome AS setlist, sm.posicao, m.titulo AS musica,
       m.artista, m.duracao_segundos
FROM setlists AS s
INNER JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
INNER JOIN musicas AS m ON m.id = sm.musica_id
ORDER BY s.nome, sm.posicao, sm.id;

-- Agregação: mantém setlists vazias e devolve duração zero para elas.
SELECT s.id, s.nome, COUNT(sm.id)::integer AS quantidade_musicas,
       COALESCE(SUM(m.duracao_segundos), 0)::double precision AS duracao_total_segundos
FROM setlists AS s
LEFT JOIN setlist_musicas AS sm ON sm.setlist_id = s.id
LEFT JOIN musicas AS m ON m.id = sm.musica_id
GROUP BY s.id, s.nome
ORDER BY s.id;

-- Quantidade total de músicas na biblioteca.
SELECT COUNT(*)::integer AS total_musicas FROM musicas;
