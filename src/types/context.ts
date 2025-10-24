import type { CookieOptions } from './cookie';
import type { Plugins } from './http';

/**
 * Request context types
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
