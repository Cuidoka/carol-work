PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 120),
  artista TEXT NOT NULL CHECK (length(trim(artista)) BETWEEN 1 AND 120),
  duracao_segundos INTEGER NOT NULL
    CHECK (typeof(duracao_segundos) = 'integer' AND duracao_segundos BETWEEN 1 AND 36000),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  letra TEXT NOT NULL DEFAULT '' CHECK (length(letra) <= 20000),
  cifra TEXT NOT NULL DEFAULT '' CHECK (length(cifra) <= 20000),
  tom TEXT NOT NULL DEFAULT '' CHECK (length(tom) <= 12),
  notas TEXT NOT NULL DEFAULT '' CHECK (length(notas) <= 2000),
  letra_fonte TEXT NOT NULL DEFAULT '' CHECK (length(letra_fonte) <= 120),
  cifra_fonte TEXT NOT NULL DEFAULT '' CHECK (length(cifra_fonte) <= 500),
  duracao_fonte TEXT NOT NULL DEFAULT '' CHECK (length(duracao_fonte) <= 500)
);

CREATE TABLE IF NOT EXISTS setlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 120),
  evento TEXT NOT NULL DEFAULT '' CHECK (length(evento) <= 120),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS setlist_musicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setlist_id INTEGER NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  musica_id INTEGER NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL CHECK (typeof(posicao) = 'integer' AND posicao >= 1),
  UNIQUE (setlist_id, musica_id)
);

CREATE INDEX IF NOT EXISTS idx_setlist_ordem ON setlist_musicas(setlist_id, posicao);
CREATE INDEX IF NOT EXISTS idx_vinculo_musica ON setlist_musicas(musica_id);
