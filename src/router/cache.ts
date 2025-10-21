import type { RouteMatch } from './types';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  match: RouteMatch<T>;
  expiresAt: number;
}

/**
 * A simple in-memory cache for route matches with TTL support
 * @template T - Type of the route match metadata
 */
export class RouteCache<T = unknown> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtl: number;

  /**
   * Create a new RouteCache instance
   * @param options Cache configuration
   * @param options.ttl Time-to-live in milliseconds (default: 60000)
   */
  constructor(private readonly options: { ttl?: number } = {}) {
    this.defaultTtl = options.ttl ?? 60000; // 1 minute default TTL
  }

  /**
   * Get a cached route match
   * @param key Cache key
   * @returns Cached route match or undefined if not found or expired
   */
  get(key: string): RouteMatch<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.match;
  }

  /**
   * Cache a route match
   * @param key Cache key
   * @param match Route match to cache
   * @param ttl Optional TTL override in milliseconds
   */
  set(key: string, match: RouteMatch<T>, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
    this.cache.set(key, { match, expiresAt });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of cached entries
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired cache entries
   * @returns Number of removed entries
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, { expiresAt }] of this.cache.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}