"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardBundle } from "@/lib/types";

interface State {
  data: DashboardBundle | null;
  loading: boolean;
  error: string | null;
}

let clientCache: DashboardBundle | null = null;
let clientCacheAt = 0;
const CLIENT_CACHE_TTL_MS = 30_000;

export function useDashboardData() {
  const [state, setState] = useState<State>({
    data: clientCache,
    loading: !clientCache,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!force && clientCache && Date.now() - clientCacheAt < CLIENT_CACHE_TTL_MS) {
      setState({ data: clientCache, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load dashboard data.");
      clientCache = json as DashboardBundle;
      clientCacheAt = Date.now();
      if (mounted.current) setState({ data: clientCache, loading: false, error: null });
    } catch (err) {
      if (mounted.current) {
        setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, refresh: () => load(true) };
}
