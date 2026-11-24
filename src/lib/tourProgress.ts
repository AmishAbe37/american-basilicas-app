import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

// Where the visitor is in a day tour, kept only on this phone (no account, no signal needed).

export type Progress = {
  current: number;           // index into the tour's stops
  started: string;           // ISO time the tour was started
  finished: boolean;
};

const K = (id: string) => `ab:tour:${id}`;
const listeners = new Map<string, Set<(p: Progress | null) => void>>();
const cache = new Map<string, Progress | null>();

function emit(id: string, p: Progress | null) {
  cache.set(id, p);
  listeners.get(id)?.forEach((f) => f(p));
}

async function save(id: string, p: Progress | null) {
  emit(id, p);
  try {
    if (p) await AsyncStorage.setItem(K(id), JSON.stringify(p));
    else await AsyncStorage.removeItem(K(id));
  } catch {
    // storage full or unavailable: the tour still works for this session
  }
}

/** The saved progress for one tour, shared by every screen showing it. */
export function useTourProgress(id: string, stopCount: number) {
  const [p, setP] = useState<Progress | null>(cache.get(id) ?? null);
  const [ready, setReady] = useState(cache.has(id));

  useEffect(() => {
    let alive = true;
    const f = (x: Progress | null) => { if (alive) setP(x); };
    if (!listeners.has(id)) listeners.set(id, new Set());
    listeners.get(id)!.add(f);
    if (!cache.has(id)) {
      AsyncStorage.getItem(K(id))
        .then((s) => {
          let x: Progress | null = null;
          try { x = s ? JSON.parse(s) : null; } catch { x = null; }
          if (x && (typeof x.current !== "number" || x.current < 0 || x.current >= stopCount)) x = null;  // the tour changed
          emit(id, x);
        })
        .catch(() => emit(id, null))
        .finally(() => { if (alive) setReady(true); });
    } else setP(cache.get(id) ?? null);
    return () => { alive = false; listeners.get(id)?.delete(f); };
  }, [id, stopCount]);

  const start = useCallback(() => save(id, { current: 0, started: new Date().toISOString(), finished: false }), [id]);
  const go = useCallback((current: number) => {
    const prev = cache.get(id);
    save(id, { started: prev?.started || new Date().toISOString(), finished: false, current: Math.max(0, Math.min(stopCount - 1, current)) });
  }, [id, stopCount]);
  const finish = useCallback(() => {
    const prev = cache.get(id);
    save(id, { started: prev?.started || new Date().toISOString(), current: stopCount - 1, finished: true });
  }, [id, stopCount]);
  const reset = useCallback(() => save(id, null), [id]);

  return { progress: p, ready, start, go, finish, reset };
}
