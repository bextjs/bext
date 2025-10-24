import type { HttpMethod } from './http';

/**
 * File system directory entry type
 */
export interface Dirent {
  readonly name: string;
  readonly path: string;
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}

/**
 * Route definition and matching types
 */
export interface Route {
  readonly methods: readonly HttpMethod[];
  readonly path: string;
  readonly file: string;
  readonly pattern: RegExp;
  readonly keys: readonly string[];
}

// Import Context from main index to avoid circular dependency
import type { Context } from './index';

export type RouteHandler = (ctx: Context) => Response | Promise<Response>;

export interface RouteMatch<T = unknown> {
  /** Route parameters */
  readonly params: Readonly<Record<string, string>>;

  /** Lazy-load the route handler */
  load: () => Promise<{ default: RouteHandler }>;

  /** Additional metadata */
  meta?: T;
}

export interface CachedRouteMatch<T = unknown> {
  readonly match: RouteMatch<T>;
  readonly expiresAt: number;
}

/**
 * Router configuration and interface types
 */
export interface RouterOptions {
  /**
   * Enable route caching
   * @default true
   */
  readonly cache?: boolean;

  /**
   * Cache TTL in milliseconds
   * @default 60000 (1 minute)
   */
  readonly cacheTtl?: number;

  /**
   * Common prefix for all routes
   */
  readonly prefix?: string;
}

export interface Router<T = unknown> {
  /**
   * Match a request to a route
   * @param req The incoming request
   * @returns Matched route or null if no match
   */
  match(req: Readonly<Request>): Promise<RouteMatch<T> | null>;

  /**
   * List of all registered routes
   */
  readonly routes: ReadonlyArray<Readonly<Route>>;
}
