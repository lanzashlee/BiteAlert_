// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates
const LOGIN_CACHE_DURATION = 30 * 1000; // 30 seconds for login-related data

export const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached) {
    // Use shorter cache duration for login-related endpoints
    const duration = key.includes('/login') || key.includes('/account-status') 
      ? LOGIN_CACHE_DURATION 
      : CACHE_DURATION;
    
    if (Date.now() - cached.timestamp < duration) {
      return cached.data;
    }
  }
  return null;
};

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = (pattern) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};
