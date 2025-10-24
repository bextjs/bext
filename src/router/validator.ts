import { access, constants } from 'fs/promises';
import path from 'path';
import { RouteValidationError } from '../core/errors';
import type { HttpMethod, Route } from '../types';

/**
 * Supported HTTP methods
 */
const HTTP_METHODS: ReadonlyArray<HttpMethod> = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS'
] as const;

type RouteInput = Omit<Route, 'pattern' | 'keys'>;

/**
 * Validates a route configuration object
 * @param route Route configuration to validate
 * @throws {RouteValidationError} If the route is invalid
 */
export function validateRoute(route: Readonly<RouteInput>): void {
  validateMethods(route.methods);
  validatePath(route.path);
  validateFile(route.file);
}

/**
 * Validates the HTTP methods array
 */
function validateMethods(methods: readonly string[]): asserts methods is HttpMethod[] {
  if (!Array.isArray(methods) || methods.length === 0) {
    throw new RouteValidationError(
      'Route methods must be a non-empty array',
      'INVALID_METHODS',
      'methods'
    );
  }

  for (const method of methods) {
    if (!HTTP_METHODS.includes(method as HttpMethod)) {
      throw new RouteValidationError(
        `Invalid HTTP method: ${method}. Must be one of: ${HTTP_METHODS.join(', ')}`,
        'INVALID_METHOD',
        'methods'
      );
    }
  }
}

/**
 * Validates the route path
 */
function validatePath(path: string): void {
  if (typeof path !== 'string' || path.trim() === '') {
    throw new RouteValidationError(
      'Route path must be a non-empty string',
      'INVALID_PATH',
      'path'
    );
  }

  if (!path.startsWith('/')) {
    throw new RouteValidationError(
      `Route path must start with '/': ${path}`,
      'PATH_MUST_START_WITH_SLASH',
      'path'
    );
  }

  // Prevent path traversal
  if (path.includes('..') || path.includes('//')) {
    throw new RouteValidationError(
      `Invalid path: ${path}. Path traversal is not allowed`,
      'INVALID_PATH_TRAVERSAL',
      'path'
    );
  }
}

/**
 * Validates the route file
 */
async function validateFile(file: string): Promise<void> {
  if (typeof file !== 'string' || file.trim() === '') {
    throw new RouteValidationError(
      'Route file must be a non-empty string',
      'INVALID_FILE',
      'file'
    );
  }

  // Check file extension
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.ts' && ext !== '.js') {
    throw new RouteValidationError(
      `Route file must be a TypeScript or JavaScript file: ${file}`,
      'INVALID_FILE_EXTENSION',
      'file'
    );
  }

  // Check if file exists and is readable
  try {
    await access(file, constants.R_OK);
  } catch (error) {
    throw new RouteValidationError(
      `Route file not found or not readable: ${file}`,
      'FILE_NOT_FOUND',
      'file'
    );
  }
}

/**
 * Validates a route and returns a boolean result
 * @param route Route to validate
 * @returns Validation result with error details if invalid
 */
export function validateRouteSafe(
  route: Readonly<RouteInput>
): { valid: true } | { valid: false; error: RouteValidationError } {
  try {
    validateRoute(route);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof RouteValidationError 
        ? error 
        : new RouteValidationError(
            'Unknown validation error',
            'UNKNOWN_ERROR'
          )
    };
  }
}

export { RouteValidationError };
