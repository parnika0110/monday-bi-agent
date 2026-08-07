// -----------------------------------------------------------------------
// Minimal in-memory TTL cache.
//
// Monday.com board data doesn't need to be re-fetched on every single KPI
// card / chart request a dashboard page fires in quick succession. This
// cache lives for the lifetime of the server process (dev server, or a
// warm serverless instance) and is intentionally simple - no external
// cache service required to run this project.
//
// Not a substitute for a real cache (Redis/etc) at high traffic, but for
// a small internal BI tool it removes the N-simultaneous-fetches problem
// with zero new infrastructure.
// -----------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 45_000;

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  // Coalesce concurrent callers asking for the same key (e.g. six chart
  // components all mounting at once) into a single upstream fetch.
  const inFlightPromise = inflight.get(key) as Promise<T> | undefined;
  if (inFlightPromise) {
    return inFlightPromise;
  }

  const promise = fn()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      inflight.delete(key);
      return value;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function invalidateCache(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
