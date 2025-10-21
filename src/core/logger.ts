/**
 * Simple logger utility that can be tree-shaken in production
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.debug(`[BEXT] ${message}`, ...args);
    }
  },
  log: (message: string, ...args: any[]) => {
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.log(`[BEXT] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[BEXT] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[BEXT] ${message}`, ...args);
  },
  system: (message: string) => {
    console.log(`${message}`);
  }
};
