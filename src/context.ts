import type { Context, CookieOptions, Plugins } from "./types";

interface CreateContextOptions {
  params?: Record<string, string>;
  env?: Record<string, unknown>;
  plugins?: Plugins;
}

export async function createContext<T = unknown>(
  req: Request,
  opts: CreateContextOptions = {}
): Promise<Context<T>> {
  const resHeaders = new Headers();

  // Optimize: Use direct assignment instead of spreading for better performance
  const params = opts.params ? Object.freeze({ ...opts.params }) : Object.freeze({});
  const env = opts.env ? Object.freeze({ ...opts.env }) : Object.freeze({});
  const plugins = opts.plugins ? Object.freeze({ ...opts.plugins }) : Object.freeze({});

  const context: Context<T> = {
    req,
    resHeaders,
    params,
    env,
    plugins,

    /**
     * Sets a cookie with the given name and value
     * @param name - Cookie name
     * @param value - Cookie value
     * @param options - Cookie configuration options
     * @throws {TypeError} If cookie name is invalid
     */
    setCookie(
      name: string,
      value: string,
      options: CookieOptions = {}
    ): void {
      if (!name || typeof name !== 'string') {
        throw new TypeError('Cookie name must be a non-empty string');
      }

      // Set secure by default in production
      const isProduction = process.env.NODE_ENV === 'production';
      const secure = options.secure ?? isProduction;

      // Set httpOnly by default for security
      const httpOnly = options.httpOnly ?? true;

      // Set sameSite to 'lax' by default for CSRF protection
      const sameSite = options.sameSite ?? 'lax';

      req.cookies.set(name, value, {
        ...options,
        secure,
        httpOnly,
        sameSite,
      });
    },

    /**
     * Gets a cookie value by name
     * @param name - Cookie name
     * @returns The cookie value or undefined if not found
     */
    getCookie(name: string): string | undefined {
      if (!name || typeof name !== 'string') {
        throw new TypeError('Cookie name must be a non-empty string');
      }
      return req.cookies.get(name);
    },

    /**
     * Deletes a cookie by setting its expiration in the past
     * @param name - Cookie name
     * @param path - Optional path (must match the path used when setting the cookie)
     */
    deleteCookie(name: string, path: string = '/'): void {
      if (!name || typeof name !== 'string') {
        throw new TypeError('Cookie name must be a non-empty string');
      }

      // Set expiration in the past to delete the cookie
      req.cookies.set(name, '', {
        path,
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    },

    json<D = T>(data: D, status = 200, init: ResponseInit = {}): Response {
      // Handle different header types properly
      const initHeadersObj = init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers as Record<string, string> | undefined || {};

      const headersInit: Record<string, string> = {
        ...initHeadersObj,
        'Content-Type': 'application/json',
        ...Object.fromEntries(this.resHeaders.entries())
      };

      const headers = new Headers(headersInit);

      return new Response(JSON.stringify(data), {
        ...init,
        status,
        headers
      });
    },

    text(data: string, status = 200, init: ResponseInit = {}): Response {
      // Handle different header types properly
      const initHeadersObj = init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers as Record<string, string> | undefined || {};

      const headersInit: Record<string, string> = {
        ...initHeadersObj,
        'Content-Type': 'text/plain',
        ...Object.fromEntries(this.resHeaders.entries())
      };

      const headers = new Headers(headersInit);

      return new Response(data, {
        ...init,
        status,
        headers
      });
    },

    send<D = unknown>(data: D, status = 200, init: ResponseInit = {}): Response {
      if (data === null || data === undefined) {
        return new Response(null, { status: 204, ...init });
      }

      if (data instanceof Response) {
        return data;
      }

      if (typeof data === 'object' || Array.isArray(data)) {
        // Create a new response with the provided init options
        const response = context.json(data, status);

        // If no additional headers are provided, return the response as is
        if (!init?.headers) {
          return response;
        }

        // Create a new Headers object with the response headers
        const headers = new Headers(response.headers);

        // Convert init.headers to a plain object if it's a Headers instance
        const initHeaders = init.headers instanceof Headers
          ? Object.fromEntries(init.headers.entries())
          : init.headers;

        // Merge headers
        Object.entries(initHeaders).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Handle header values that are arrays
            value.forEach(v => headers.append(key, v));
          } else if (value) {
            // Set or append the header
            headers.set(key, value.toString());
          }
        });

        // Create a new response with merged headers
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(headers.entries())
        });
      }

      // For non-object/non-array data, use text response
      return context.text(String(data), status, init);
    }
  };

  return context;
}