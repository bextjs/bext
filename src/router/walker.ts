import { readdir } from 'node:fs/promises';
import * as path from 'node:path';

const { join, resolve } = path;

import { isRouteFile } from './parser';
import { registerRouteFile } from './registry';
import { logger } from '../core/logger';
import type { Dirent } from './types';

/**
 * Reads a directory and returns its entries with proper typing
 * Uses node:fs/promises as recommended by Bun for directory operations
 */
export const readDirectory = async (dirPath: string): Promise<Dirent[]> => {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    return entries.map(entry => ({
      name: entry.name,
      path: join(dirPath, entry.name),
      isFile: () => entry.isFile(),
      isDirectory: () => entry.isDirectory(),
      isSymbolicLink: () => entry.isSymbolicLink()
    }));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw error;
  }
};

/**
 * Recursively walks through the directory and registers routes
 */
export async function walk(
  dir: string,
  prefix = '',
  matcher: any
): Promise<void> {
  let entries: Dirent[] = [];

  try {
    entries = await readDirectory(dir);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  // Sort entries to process index files first, then other files, then directories
  entries.sort((a, b) => {
    // Directories come last
    if (a.isDirectory() && !b.isDirectory()) return 1;
    if (!a.isDirectory() && b.isDirectory()) return -1;

    // For files, sort index files first
    if (!a.isDirectory() && !b.isDirectory()) {
      const aIsIndex = a.name.startsWith('index.');
      const bIsIndex = b.name.startsWith('index.');
      if (aIsIndex && !bIsIndex) return -1;
      if (!aIsIndex && bIsIndex) return 1;
    }

    // Otherwise sort alphabetically
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    const isDirectory = entry.isDirectory();
    const isFile = !isDirectory && isRouteFile(entry.name);

    if (isDirectory) {
      // For directories, use the directory name as part of the URL path
      const newPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      await walk(fullPath, newPrefix, matcher);
    } else if (isFile) {
      try {
        await registerRouteFile(matcher, entry.name, fullPath, prefix);
      } catch (error) {
        logger.error(`Failed to register route file ${fullPath}:`, error);
        throw error; // Re-throw to stop server startup
      }
    }
  }
}
