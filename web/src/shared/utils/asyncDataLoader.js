const responseCache = new Map();

const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target || {}, key);

const normalizeUrl = (url) => String(url || "").trim();

const normalizeTtl = (ttlMs) => {
  const value = Number(ttlMs);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const normalizeConcurrency = (concurrency, itemCount) => {
  const value = Math.floor(Number(concurrency) || 0);
  const workerCount = Number.isFinite(value) && value > 0 ? value : 1;
  return Math.max(1, Math.min(workerCount, Math.max(1, itemCount)));
};

const isCacheEntryFresh = (entry, ttlMs, now) => {
  if (!entry || !hasOwn(entry, "data")) return false;
  if (ttlMs <= 0) return false;
  const age = now - Number(entry.updatedAt || 0);
  return age <= ttlMs;
};

export const fetchJsonWithCache = async (
  url,
  {
    ttlMs = 0,
    forceRefresh = false,
    requestCache = "default",
    staleIfError = true,
  } = {}
) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    throw new Error("URL is required to fetch JSON.");
  }

  const now = Date.now();
  const normalizedTtl = normalizeTtl(ttlMs);
  const existing = responseCache.get(normalizedUrl);

  if (!forceRefresh && isCacheEntryFresh(existing, normalizedTtl, now)) {
    return existing.data;
  }

  if (existing?.promise) {
    return existing.promise;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(normalizedUrl, { cache: requestCache });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      responseCache.set(normalizedUrl, {
        data,
        updatedAt: Date.now(),
        promise: null,
      });
      return data;
    } catch (error) {
      const cached = responseCache.get(normalizedUrl);
      if (staleIfError && hasOwn(cached, "data")) {
        console.warn(`[async-data-loader] fallback to stale cache for ${normalizedUrl}`, error);
        return cached.data;
      }
      throw error;
    } finally {
      const latest = responseCache.get(normalizedUrl);
      if (latest?.promise === fetchPromise) {
        responseCache.set(normalizedUrl, {
          data: latest.data,
          updatedAt: latest.updatedAt,
          promise: null,
        });
      }
    }
  })();

  responseCache.set(normalizedUrl, {
    data: existing?.data,
    updatedAt: existing?.updatedAt || 0,
    promise: fetchPromise,
  });
  return fetchPromise;
};

export const mapWithConcurrency = async (
  items = [],
  mapper,
  { concurrency = 1 } = {}
) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];
  if (typeof mapper !== "function") {
    throw new TypeError("mapper must be a function");
  }

  const workerCount = normalizeConcurrency(concurrency, list.length);
  const results = new Array(list.length);
  let nextIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < list.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(list[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

