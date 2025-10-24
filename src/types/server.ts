import type { Plugins } from './http';

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
