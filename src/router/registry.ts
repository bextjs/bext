import { logger } from '../core/logger';
import { RouteMatcher } from './matcher';
import { compileRoutePattern, loadRouteMethods, parseFileName } from './parser';

/**
 * Builds a route path from prefix and name
 */
export function buildRoutePath(prefix: string, name: string, isIndex: boolean): string {
  if (isIndex) {
    return !prefix ? '/' : `/${prefix}/`;
  }

  if (name.startsWith('[') && name.endsWith(']')) {
    return prefix ? `/${prefix}${name}` : `/${name}`;
  }

  return prefix ? `/${prefix}/${name}` : `/${name}`;
}

/**
 * Registers a single route file with the router
 */
export async function registerRouteFile(
  matcher: RouteMatcher,
  filename: string,
  fullPath: string,
  prefix: string
): Promise<void> {
  const { name, methods: defaultMethods, isIndex } = parseFileName(filename);

  // Load the actual HTTP methods exported by the module
  const methods = await loadRouteMethods(fullPath);

  // Build the route path
  let routePath = buildRoutePath(prefix, name, isIndex);

  // Clean up any duplicate slashes, but preserve the ones in dynamic segments
  routePath = routePath.replace(/(?<!\[.*?)\/+(?=.*?\]|\/|$)/g, '/');

  // Ensure the route path is valid
  if (!routePath.startsWith('/')) {
    routePath = `/${routePath}`;
  }

  // Ensure there's a slash before dynamic segments
  routePath = routePath.replace(/([^/])(\[)/g, '$1/$2');

  try {
    // For pattern matching, remove trailing slash unless it's the root
    const patternPath = routePath.endsWith('/') && routePath !== '/'
      ? routePath.slice(0, -1)
      : routePath;

    const { pattern, keys } = compileRoutePattern(patternPath);

    // Register the route with the matcher
    matcher.add({
      methods,
      path: routePath,
      file: fullPath,
      pattern,
      keys,
    });

  } catch (error) {
    logger.error(`Failed to register route ${methods.join(', ')} ${routePath}:`, error);
    throw error; // Re-throw to stop server startup if route file is invalid
  }
}
