const paths = {
  book: 'M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
  pause: 'M8 5v14M16 5v14',
  list: 'M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01',
  music: 'M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M6 18 18 6',
  edit: 'm15 5 4 4M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  up: 'm6 12 6-6 6 6M12 6v14', down: 'm6 12 6 6 6-6M12 18V4',
  arrow: 'M6 18 18 6M6 6h12v12', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  check: 'm5 12 4 4L19 6', alert: 'M12 8v5m0 4h.01M10 3 1 19h22L14 3Z',
  spark: 'M12 2v20M2 12h20M5 5l14 14M5 19 19 5', wave: 'M4 9v6m5-11v16m6-13v10m5-7v4'
};
export default function Icon({ name, size = 18, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}><path d={paths[name] || paths.music} /></svg>;
}
