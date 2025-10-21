import * as path from 'node:path';
import { pathToFileURL } from 'url';

const { basename, extname } = path;

import { logger } from '../core/logger';
import type { HttpMethod } from './types';

// Allowed file extensions for route handlers
export const ROUTE_FILE_EXTENSIONS = new Set(['.ts']);

/**
 * Checks if a file is a valid route file
 */
export function isRouteFile(filename: string): boolean {
  // Skip non-TypeScript files
  const ext = extname(filename).toLowerCase();
  if (!ROUTE_FILE_EXTENSIONS.has(ext)) {
    return false;
  }

  // Skip declaration files
  if (filename.endsWith('.d.ts')) {
    return false;
  }

  // Accept any .ts file as a potential route file
  return true;
}

/**
 * Parses route file names for Next.js-style API routes
 */
export function parseFileName(
  filename: string
): { name: string; methods: HttpMethod[]; isIndex: boolean } {
  const ext = extname(filename);
  const baseName = basename(filename, ext);

  // Handle index files
  if (baseName === 'index') {
    return { name: '', methods: ['GET'], isIndex: true };
  }

  // Handle dynamic routes like [id].ts
  if (baseName.startsWith('[') && baseName.endsWith(']')) {
    const paramName = baseName.slice(1, -1); // Remove [ and ]
    return {
      name: `[${paramName}]`,
      methods: ['GET'], // Default method, will be overridden when loading the module
      isIndex: false
    };
  }

  // Handle regular route files like hello.ts
  const isIndex = baseName === 'index';
  return {
    name: isIndex ? '' : baseName,
    methods: ['GET'], // Default method, will be overridden when loading the module
    isIndex
  };
}

// Cache for compiled route patterns
const patternCache = new Map<string, { pattern: RegExp; keys: string[] }>();

/**
 * Compiles a route path pattern into a regex for matching
 */
export function compileRoutePattern(routePath: string): { pattern: RegExp; keys: string[] } {
  // Check cache first
  const cached = patternCache.get(routePath);
  if (cached) {
    return cached;
  }

  const keys: string[] = [];

  // Convert route path to a regex pattern
  const pattern = routePath
    .replace(/\//g, '\\/')
    .replace(/\[([^\]]+)\]/g, (_, key: string) => {
      // Handle dynamic segments like [id]
      keys.push(key);
      return '([^\\/]+)';
    })
    .replace(/:([^\/]+)/g, (_, key: string) => {
      // Handle legacy :param format (if needed)
      if (!keys.includes(key)) {
        keys.push(key);
      }
      return '([^\\/]+)';
    });

  const result = {
    pattern: new RegExp(`^${pattern}\/?$`),
    keys
  };

  // Cache the result
  patternCache.set(routePath, result);
  return result;
}

/**
 * Loads a route module and detects which HTTP methods are exported
 */
export async function loadRouteMethods(filePath: string): Promise<HttpMethod[]> {
  try {
    const module = await import(pathToFileURL(filePath).href);

    const httpMethods: HttpMethod[] = [];
    const methodNames: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    // Check for exported HTTP method functions
    for (const method of methodNames) {
      if (typeof module[method] === 'function') {
        httpMethods.push(method);
      }
    }

    // Throw error if no HTTP methods are exported
    if (httpMethods.length === 0) {
      throw new Error(`Route file must export at least one HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS): ${filePath}`);
    }

    return httpMethods;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Route file must export at least one HTTP method')) {
      throw error;
    }
    logger.warn(`Failed to load route module ${filePath}:`, error);
    throw new Error(`Failed to load route module ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
