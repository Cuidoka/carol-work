import { duration, countSongs } from '../lib/format.mjs';
import { sourceURL } from '../../lib/music-sources.mjs';

// Só é exibido na impressão: o navegador gera o PDF a partir deste repertório.
export default function PrintSetlist({ detail }) {
  if (!detail) return null;
  let elapsed = 0;
  return <section className="print-sheet" aria-label="Repertório para impressão">
    <header><p className="print-brand">SETLIST · REPERTÓRIO</p><h1>{detail.nome}</h1>{detail.evento && <p>{detail.evento}</p>}<p>{countSongs(detail.quantidade_musicas)} · Duração total: <strong>{duration(detail.duracao_total_segundos)}</strong></p></header>
    <table><thead><tr><th>#</th><th>Música / artista</th><th>Tom</th><th>Duração</th><th>Início</th></tr></thead><tbody>{detail.musicas.map((song, index) => {
      const start = elapsed; elapsed += song.duracao_segundos;
      const link = sourceURL(song.cifra_fonte);
      return <tr key={song.id}><td>{String(index + 1).padStart(2, '0')}</td><td><strong>{song.titulo}</strong><p>{song.artista}</p>{song.notas && <p className="print-notes">{song.notas}</p>}{link && <p className="print-link">Cifra: <a href={link}>{link}</a></p>}</td><td>{song.tom || '—'}</td><td>{duration(song.duracao_segundos)}</td><td>{duration(start)}</td></tr>;
    })}</tbody></table>
    {!detail.musicas.length && <p>Este repertório ainda não tem músicas.</p>}
    <footer>Total: {duration(detail.duracao_total_segundos)} · {countSongs(detail.quantidade_musicas)}</footer>
  </section>;
}
