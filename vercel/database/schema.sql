-- PostgreSQL/Neon: banco independente do SQLite da versão local.
BEGIN;

CREATE TABLE IF NOT EXISTS musicas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL CHECK (length(btrim(titulo)) BETWEEN 1 AND 120),
  artista TEXT NOT NULL CHECK (length(btrim(artista)) BETWEEN 1 AND 120),
  duracao_segundos INTEGER NOT NULL CHECK (duracao_segundos BETWEEN 1 AND 36000),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS setlists (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL CHECK (length(btrim(nome)) BETWEEN 1 AND 120),
  evento TEXT NOT NULL DEFAULT '' CHECK (length(evento) <= 120),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migração aditiva e idempotente para bancos já existentes. Não recria tabelas.
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS letra TEXT NOT NULL DEFAULT '' CHECK (length(letra) <= 20000);
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS cifra TEXT NOT NULL DEFAULT '' CHECK (length(cifra) <= 20000);
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS tom TEXT NOT NULL DEFAULT '' CHECK (length(tom) <= 12);
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS notas TEXT NOT NULL DEFAULT '' CHECK (length(notas) <= 2000);
ALTER TABLE musicas ADD COLUMN IF NOT EXISTS letra_fonte TEXT NOT NULL DEFAULT '' CHECK (length(letra_fonte) <= 120);

CREATE TABLE IF NOT EXISTS setlist_musicas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  setlist_id INTEGER NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  musica_id INTEGER NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL CHECK (posicao >= 1),
  UNIQUE (setlist_id, musica_id)
);

CREATE INDEX IF NOT EXISTS idx_setlist_ordem ON setlist_musicas(setlist_id, posicao);
CREATE INDEX IF NOT EXISTS idx_vinculo_musica ON setlist_musicas(musica_id);
COMMIT;
