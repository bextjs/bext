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
