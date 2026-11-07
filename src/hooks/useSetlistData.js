import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.mjs';

export function useSetlistData() {
  const [data, setData] = useState({ songs: [], setlists: [], selectedId: null, detail: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedRef = useRef(null), sequence = useRef(0), busyRef = useRef(false);

  const reload = useCallback(async (preferred = selectedRef.current) => {
    const request = ++sequence.current;
    setRefreshing(true);
    try {
      const [songs, setlists] = await Promise.all([api('/musicas'), api('/setlists')]);
      const selectedId = setlists.some(item => item.id === preferred) ? preferred : (setlists[0]?.id ?? null);
      const detail = selectedId === null ? null : await api(`/setlists/${selectedId}`);
      if (request === sequence.current) {
        selectedRef.current = selectedId;
        setData({ songs, setlists, selectedId, detail });
        setError('');
      }
    } catch (error) { if (request === sequence.current) setError(error.message); throw error; }
    finally { if (request === sequence.current) { setLoading(false); setRefreshing(false); } }
  }, []);

  const selectSetlist = useCallback(async id => {
    const request = ++sequence.current;
    setRefreshing(true);
    try {
      const detail = await api(`/setlists/${id}`);
      if (request === sequence.current) {
        selectedRef.current = id;
        setData(current => ({ ...current, selectedId: id, detail }));
        setError('');
      }
    } catch (error) { if (request === sequence.current) setError(error.message); }
    finally { if (request === sequence.current) setRefreshing(false); }
  }, []);

  const mutate = useCallback(async task => {
    if (busyRef.current) throw new Error('Aguarde a operação atual terminar.');
    busyRef.current = true; setBusy(true);
    try { return await task(); }
    finally { busyRef.current = false; setBusy(false); }
  }, []);

  useEffect(() => { void reload().catch(() => {}); return () => { sequence.current++; }; }, [reload]);
  return { ...data, loading, refreshing, busy, error, reload, selectSetlist, mutate, setError };
}
