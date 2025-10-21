import path from 'path';
import type { RouterOptions } from '../router/types';

const DEFAULT_ROUTES_DIR = path.resolve(process.cwd(), "app/api");

/**
 * Default router configuration options
 */
export const DEFAULT_ROUTER_OPTIONS: Required<RouterOptions> = {
  cache: true,
  cacheTtl: 60000, // 1 minute
  debug: false,
  prefix: ''
};

/**
 * Default server configuration options
 */
export const DEFAULT_SERVER_OPTIONS = {
  port: 8000,
  routesDir: DEFAULT_ROUTES_DIR,
  prefix: '',
} as const;

/**
 * Merges user options with default options
 */
export function mergeOptions<T extends Record<string, unknown>>(
  defaults: T,
  userOptions: Partial<T> = {}
): T {
  return { ...defaults, ...userOptions };
}
