import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// Keeps list filters/pagination in the URL so they survive refresh, can be
// shared, and work with the back button. `schema` maps keys to defaults;
// array defaults mark multi-value params.
export function useUrlState(schema) {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const out = {};
    for (const [key, def] of Object.entries(schema)) {
      if (Array.isArray(def)) out[key] = params.getAll(key);
      else if (typeof def === "number") {
        const n = Number(params.get(key));
        out[key] = params.has(key) && Number.isFinite(n) ? n : def;
      } else out[key] = params.get(key) ?? def;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...(resetPage && "page" in schema ? { page: undefined } : {}), ...patch };
          for (const [key, value] of Object.entries(merged)) {
            next.delete(key);
            const def = schema[key];
            if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
            else if (value !== undefined && value !== null && value !== "" && value !== def) next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [schema, setParams]
  );

  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return [state, update, reset];
}
