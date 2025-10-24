/**
 * HTTP-related types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type Plugins = {
  [K in string]?: unknown;
};
