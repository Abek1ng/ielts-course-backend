// utils/cacheService.js
const NodeCache = require('node-cache');

// Initialize cache with 30 minute TTL
const cache = new NodeCache({ stdTTL: 1800 });

const CACHE_KEYS = {
  MODULES: 'modules',
  MODULE: (id) => `module_${id}`,
  LESSONS: (moduleId) => `lessons_${moduleId}`,
  LESSON: (id) => `lesson_${id}`,
  USER_ACCESS: (userId) => `user_access_${userId}`
};

const cacheService = {
  // Get item from cache
  get: (key) => {
    return cache.get(key);
  },

  // Set item in cache
  set: (key, value) => {
    cache.set(key, value);
  },

  // Delete item from cache
  delete: (key) => {
    cache.del(key);
  },

  // Clear all cache
  clear: () => {
    cache.flushAll();
  },

  // Clear module-related caches
  clearModuleCache: (moduleId) => {
    cache.del(CACHE_KEYS.MODULES);
    cache.del(CACHE_KEYS.MODULE(moduleId));
    cache.del(CACHE_KEYS.LESSONS(moduleId));
  },

  // Clear user-related caches
  clearUserCache: (userId) => {
    cache.del(CACHE_KEYS.USER_ACCESS(userId));
  }
};

// Middleware to cache responses
const cacheMiddleware = (key, duration = 1800) => {
  return (req, res, next) => {
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store the original res.json to override it
    const originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      return originalJson.call(res, body);
    };

    next();
  };
};

module.exports = {
  cacheService,
  cacheMiddleware,
  CACHE_KEYS
};