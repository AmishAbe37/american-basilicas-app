import { useCallback, useMemo, useState } from "react";

/** Which state card is open on the Map tab, and which basilica in it is picked. */
export type Picked = { state: string | null; id: string | null; set: (state: string | null, id: string | null) => void };

export function usePicked(): Picked {
  const [p, setP] = useState<{ state: string | null; id: string | null }>({ state: null, id: null });
  const set = useCallback((state: string | null, id: string | null) => setP({ state, id }), []);
  return useMemo(() => ({ ...p, set }), [p, set]);
}
