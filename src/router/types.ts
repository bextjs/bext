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
 * Type-safe plugin system where each plugin has a known shape
 */
export type Plugins = {
  [K in string]?: unknown;
};

/**
 * Supported HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Route definition interface
 */
export interface Route {
  readonly methods: readonly HttpMethod[];
  readonly path: string;
  readonly file: string;
  readonly pattern: RegExp;
  readonly keys: readonly string[];
}

/**
 * Handler function type for route handlers
 */
export type RouteHandler = (ctx: Context) => Response | Promise<Response>;

/**
 * Matched route information
 */
export interface RouteMatch<T = unknown> {
  /** Route parameters */
  readonly params: Readonly<Record<string, string>>;
  
  /** Lazy-load the route handler */
  load: () => Promise<{ default: RouteHandler }>;
  
  /** Additional metadata */
  meta?: T;
}

/**
 * Router configuration options
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
   * Enable debug logging
   * @default false
   */
  readonly debug?: boolean;
  
  /**
   * Common prefix for all routes
   */
  readonly prefix?: string;
}

/**
 * Cached route match with expiration
 */
export interface CachedRouteMatch<T = unknown> {
  readonly match: RouteMatch<T>;
  readonly expiresAt: number;
}

/**
 * Router interface
 */
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

/**
 * Request context
 */
export interface Context<T = unknown> {
  /** The incoming request */
  readonly req: Readonly<Request>;
  
  /** Response headers */
  readonly resHeaders: Headers;
  
  /** Route parameters */
  readonly params: Readonly<Record<string, string>>;
  
  /** Environment variables */
  readonly env: Readonly<Record<string, unknown>>;
  
  /** Plugin instances */
  readonly plugins: Readonly<Plugins>;
  
  /** Set a cookie */
  setCookie(name: string, value: string, options?: Readonly<CookieOptions>): void;
  
  /** 
   * Get a cookie value
   * @param name - Name of the cookie to retrieve
   * @returns The cookie value or undefined if not found
   */
  getCookie(name: string): string | undefined;
  
  /**
   * Deletes a cookie by setting its expiration in the past
   * @param name - Name of the cookie to delete
   * @param path - Optional path (must match the path used when setting the cookie)
   */
  deleteCookie(name: string, path?: string): void;
  
  /** 
   * Send JSON response
   * @param data - Data to send as JSON
   * @param status - HTTP status code (default: 200)
   * @param init - Additional response options
   * @returns A Response object with JSON content-type
   */
  json<D = T>(data: D, status?: number, init?: ResponseInit): Response;
  
  /** Send text response */
  text(data: string, status?: number, init?: ResponseInit): Response;
  
  /**
   * Send a response with the given data, automatically determining the content type
   * @param data The response data
   * @param status The HTTP status code (default: 200)
   * @param init Additional response options
   */
  send<D = unknown>(data: D, status?: number, init?: ResponseInit): Response;
}

/**
 * Cookie configuration options
 * Compatible with Bun's built-in cookie API
 * 
 * @example
 * // Set a secure, HTTP-only cookie
 * ctx.setCookie('session', 'abc123', { 
 *   httpOnly: true,
 *   secure: true,
 *   sameSite: 'lax', 
 *   maxAge: 60 * 60 * 24 * 7 // 1 week
 * });
 * 
 * // Delete a cookie
 * ctx.deleteCookie('session');
 */
export interface CookieOptions {
  /** 
   * Domain for the cookie
   * @example '.example.com' for all subdomains
   */
  readonly domain?: string;
  
  /** 
   * Path for the cookie
   * @default '/'
   */
  readonly path?: string;
  
  /** 
   * Maximum age in seconds 
   * @example 3600 // 1 hour
   */
  readonly maxAge?: number;
  
  /** 
   * Expiration date
   * @example new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
   */
  readonly expires?: Date;
  
  /** 
   * HTTP-only flag
   * @default true for security
   */
  readonly httpOnly?: boolean;
  
  /** 
   * Secure flag (HTTPS only)
   * @default true in production
   */
  readonly secure?: boolean;
  
  /** 
   * Controls when cookies are sent with cross-site requests
   * @default 'lax'
   */
  readonly sameSite?: 'Strict' | 'Lax' | 'None' | 'strict' | 'lax' | 'none';
  
  /** 
   * Additional cookie attributes
   * @example { priority: 'High' } // For future use or non-standard attributes
   */
  [key: string]: unknown;
}

declare global {
  interface Request {
    /**
     * Bun's built-in cookie API
     */
    cookies: {
      get(name: string): string | undefined;
      set(name: string, value: string, options?: CookieOptions): void;
      delete(name: string): void;
      [key: string]: unknown;
    };
  }
}

/**
 * Server configuration options
 */
export interface ServerOptions {
  /** Port to listen on */
  readonly port?: number;
  
  /** Directory containing route files */
  readonly routesDir?: string;
  
  /** Environment variables */
  readonly env?: Readonly<Record<string, unknown>>;
  
  /** Plugin configurations */
  readonly plugins?: Readonly<Plugins>;
  
  /** Enable route caching */
  readonly cache?: boolean;
  
  /** Cache TTL in milliseconds */
  readonly cacheTtl?: number;
  
  /** Common prefix for all routes */
  readonly prefix?: string;
}

/**
 * Type-safe response helper
 */
export type TypedResponse<T> = Omit<Response, 'json'> & {
  json(): Promise<T>;
};