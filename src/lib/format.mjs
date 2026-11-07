export function duration(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function libraryDuration(seconds) {
  return seconds < 3600 ? `${Math.floor(seconds / 60)} min` : `${Math.floor(seconds / 3600)} h ${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')} min`;
}
export function parseDuration(value) {
  if (!/^\d{1,3}:[0-5]\d$/.test(value)) throw new Error('Use minutos:segundos, por exemplo 03:45.');
  const [minutes, seconds] = value.split(':').map(Number);
  const total = minutes * 60 + seconds;
  if (total < 1 || total > 36000) throw new Error('A duração deve estar entre 00:01 e 600:00.');
  return total;
}
export function countSongs(count) { return `${count} ${count === 1 ? 'música' : 'músicas'}`; }
