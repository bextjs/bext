import { pathToFileURL } from 'url';
import { RouteError } from '../core/errors';
import { RouteCache } from './cache';
import type { HttpMethod, Route, RouteMatch } from './types';

/**
 * Handles route matching and loading of route handlers
 */
export class RouteMatcher<T = unknown> {
  private readonly routes: Map<HttpMethod, ReadonlyArray<Readonly<Route>>> = new Map();
  private readonly cache: RouteCache<T> | null;
  private readonly prefix: string;

  /**
   * Creates a new RouteMatcher instance
   * @param options Configuration options
   * @param options.cache Whether to enable route caching (default: true)
   * @param options.cacheTtl Cache TTL in milliseconds
   * @param options.prefix Common prefix for all routes
   */
  constructor(options: { cache?: boolean; cacheTtl?: number; prefix?: string } = {}) {
    this.cache = options.cache !== false ? new RouteCache({ ttl: options.cacheTtl }) : null;
    this.prefix = options.prefix || '';
  }

  /**
   * Add a route to the matcher
   * @param route The route to add
   * @throws {RouteError} If the route is invalid
   */
  add(route: Readonly<Route>): void {
    if (!route || typeof route !== 'object') {
      throw new RouteError('Route must be an object', 'INVALID_ROUTE');
    }

    if (!route.methods || !route.path || !route.file || !route.pattern) {
      throw new RouteError('Route is missing required properties', 'INVALID_ROUTE');
    }

    // Add the route for each method it supports
    for (const method of route.methods) {
      const methodRoutes = [...(this.routes.get(method) || [])];
      methodRoutes.push(route);
      this.routes.set(method, methodRoutes);
    }
  }

  /**
   * Match a request to a route
   * @param method HTTP method
   * @param pathname Request path
   * @returns Matched route or null if no match
   */
  match(method: string, pathname: string): RouteMatch<T> | null {
    if (!method || typeof method !== 'string') {
      throw new RouteError('Method must be a string', 'INVALID_METHOD');
    }

    if (!pathname || typeof pathname !== 'string') {
      throw new RouteError('Pathname must be a string', 'INVALID_PATH');
    }

    const normalizedMethod = method.toUpperCase() as HttpMethod;
    
    // If prefix is set, check if pathname starts with it and strip it for matching
    let matchPathname = pathname;
    if (this.prefix && pathname.startsWith(this.prefix)) {
      matchPathname = pathname.slice(this.prefix.length);
      // Ensure the remaining path starts with '/' or is empty
      if (matchPathname && !matchPathname.startsWith('/')) {
        matchPathname = '/' + matchPathname;
      }
    } else if (this.prefix) {
      // If pathname doesn't start with prefix, no match
      return null;
    }
    
    const cacheKey = this.getCacheKey(normalizedMethod, matchPathname);
    
    // Check cache first
    const cachedMatch = this.getCachedMatch(cacheKey);
    if (cachedMatch) {
      return cachedMatch;
    }

    // Find matching route
    const routeMatch = this.findMatchingRoute(normalizedMethod, matchPathname);
    if (!routeMatch) {
      return null;
    }

    // Cache the match if caching is enabled
    this.cacheMatch(cacheKey, routeMatch);
    
    return routeMatch;
  }

  /**
   * Get all registered routes
   * @returns Array of all registered routes
   */
  getRoutes(): ReadonlyArray<Readonly<Route>> {
    return Array.from(this.routes.values()).flat();
  }

  /**
   * Generate a cache key for a request
   */
  private getCacheKey(method: HttpMethod, pathname: string): string {
    return `${method}:${pathname}`;
  }

  /**
   * Get a cached route match if available
   */
  private getCachedMatch(cacheKey: string): RouteMatch<T> | null {
    return this.cache?.get(cacheKey) ?? null;
  }

  /**
   * Cache a route match if caching is enabled
   */
  private cacheMatch(cacheKey: string, match: RouteMatch<T>): void {
    this.cache?.set(cacheKey, match);
  }

  /**
   * Find the first matching route for the given method and pathname
   */
  private findMatchingRoute(method: HttpMethod, pathname: string): RouteMatch<T> | null {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) return null;

    for (const route of methodRoutes) {
      const match = pathname.match(route.pattern);
      if (!match) continue;

      const params = this.extractParams(route.keys, match);
      return {
        params: Object.freeze(params) as Readonly<Record<string, string>>,
        load: () => this.loadHandler(route),
      };
    }

    return null;
  }

  /**
   * Extract parameters from URL path
   */
  private extractParams(keys: readonly string[], match: RegExpMatchArray): Record<string, string> {
    return keys.reduce<Record<string, string>>((params, key, index) => {
      const value = match[index + 1];
      if (value !== undefined) {
        params[key] = value;
      }
      return params;
    }, {});
  }

  /**
   * Load a route handler module
   */
  private async loadHandler(route: Readonly<Route>): Promise<{ default: (ctx: any) => Promise<Response> }> {
    try {
      const module = await import(pathToFileURL(route.file).href);

      // For Next.js-style API routes, we need to check for named HTTP method exports
      // The HTTP method will be determined when the route is matched
      // For now, we'll return a wrapper that will call the appropriate method handler
      const handler = async (ctx: any) => {
        const method = ctx.req.method;

        // Check if the module exports the specific HTTP method
        const methodHandler = module[method];
        if (typeof methodHandler === 'function') {
          return await methodHandler(ctx);
        }

        // If no specific method handler, check for a default handler
        if (typeof module.default === 'function') {
          return await module.default(ctx);
        }

        throw new RouteError(
          `Route handler must export either a '${method}' function or a default function: ${route.file}`,
          'INVALID_HANDLER'
        );
      };

      return { default: handler };
    } catch (error) {
      if (error instanceof RouteError) throw error;

      const message = error instanceof Error ? error.message : String(error);
      throw new RouteError(
        `Failed to load route handler: ${route.file}. Reason: ${message}`,
        'HANDLER_LOAD_ERROR'
      );
    }
  }
}