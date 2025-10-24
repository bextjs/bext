/**
 * Simple logger utility that can be tree-shaken in production
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.debug(`[BextJS] ${message}`, ...args);
    }
  },
  log: (message: string, ...args: any[]) => {
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.log(`[BextJS] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[BextJS] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[BextJS] ${message}`, ...args);
  },
};
