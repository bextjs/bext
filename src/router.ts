import { RouteMatcher } from './router/matcher';
import { walk } from './router/walker';

import * as path from 'node:path';
import { DEFAULT_ROUTER_OPTIONS } from './core/config';
import { logger } from './core/logger';
import type {
  HttpMethod,
  Route,
  RouteMatch,
  RouterOptions,
  Router as RouterType
} from './router/types';

/**
 * Creates a new router instance with the given options
 */
// Track if routes have been loaded
let routesLoaded = false;

export async function createRouter<T = unknown>(
  baseDir: string,
  options: RouterOptions = {}
): Promise<RouterType<T>> {
  const mergedOptions: Required<RouterOptions> = { ...DEFAULT_ROUTER_OPTIONS, ...options };
  const matcher = new RouteMatcher(mergedOptions);
  const debug = mergedOptions.debug ? console.debug : () => {};
  
  // Ensure base directory is absolute
  const routesDir = path.isAbsolute(baseDir) ? baseDir : path.resolve(process.cwd(), baseDir);
  
  // Initialize the router
  await initializeRoutes(routesDir);

  /**
   * Matches a request to a route and loads the handler
   */
  async function matchRoute(req: Request): Promise<RouteMatch<T> | null> {
    const url = new URL(req.url);
    const match = matcher.match(req.method as HttpMethod, url.pathname);
    
    if (!match) return null;
    
    // The matcher already returns a properly formatted RouteMatch
    // We need to cast it to include our generic type T
    return match as unknown as RouteMatch<T>;
  }

  return {
    match: matchRoute,
    get routes(): ReadonlyArray<Readonly<Route>> {
      return matcher.getRoutes();
    }
  };

  /**
   * Initializes routes by walking the directory and registering all route files
   */
  async function initializeRoutes(dir: string): Promise<void> {
    // Only load routes once
    if (routesLoaded) return;
    
    try {
      await walk(dir, '', matcher);
      routesLoaded = true;
    } catch (error) {
      logger.error('Failed to initialize routes:', error);
      throw error;
    }
  }
}
