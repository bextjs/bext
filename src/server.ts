import { createContext } from "./context";
import { DEFAULT_SERVER_OPTIONS } from "./core/config";
import { ServerError } from "./core/errors";
import { logger } from "./core/logger";
import { createRouter } from "./router";
import type { ServerOptions } from "./router/types";

// Extend ServerOptions to include additional options
interface ExtendedServerOptions extends ServerOptions {
  hostname?: string;
  debug?: boolean;
}
// Extend the Window interface to include the required types
declare global {
  interface Window {
    performance: {
      now(): number;
    };
  }
}

export async function createServer<T = unknown>(
  options: ExtendedServerOptions = {}
) {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_SERVER_OPTIONS, ...options };

  // Create and initialize router with provided options
  const router = await createRouter<T>(mergedOptions.routesDir, {
    cache: mergedOptions.cache,
    cacheTtl: mergedOptions.cacheTtl,
    debug: mergedOptions.debug,
    prefix: mergedOptions.prefix
  });

  // Initialize the server
  let server;
try { 
  
  server = Bun.serve({
    port: mergedOptions.port,
    hostname: mergedOptions.hostname,
    development: process.env.NODE_ENV !== "production",

    /**
     * Handles incoming HTTP requests
     */
    async fetch(req: Request, server: any): Promise<Response> {
      const startTime = performance.now();
      const requestId = Math.random().toString(36).substring(2, 15);

      // Log request
      logger.log(
        `[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.url}`
      );

      try {
        // Match route
        const match = await router.match(req);
        if (!match) {
          throw new ServerError("Not Found", 404, "NOT_FOUND");
        }

        // Create request context with proper typing
        const ctx = await createContext<T>(req, {
          params: match.params,
          env: mergedOptions.env || {},
          plugins: mergedOptions.plugins || {},
        });

        // Add server instance to context with proper typing
        Object.defineProperty(ctx, "server", {
          value: server,
          enumerable: false,
          configurable: true,
        });

        // Load and execute route handler
        const module = await match.load();
        if (typeof module.default !== "function") {
          throw new ServerError(
            "Invalid route handler",
            500,
            "INVALID_HANDLER"
          );
        }

        const response = await module.default(ctx);

        // Handle different response types
        let responseBody: string | null = null;
        const headers = new Headers({
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...Object.fromEntries(ctx.resHeaders.entries()),
        });

        let status = 200;

        // Handle different response types
        if (response instanceof Response) {
          return response;
        } else if (response === null || response === undefined) {
          responseBody = "";
          status = 204; // No Content
        } else if (
          typeof response === "object" ||
          typeof response === "number" ||
          typeof response === "boolean"
        ) {
          responseBody = JSON.stringify(response);
        } else {
          responseBody = String(response);
          headers.set("Content-Type", "text/plain");
        }

        const responseInit: ResponseInit = {
          status,
          headers,
        };

        // Log successful response
        const responseTime = Math.round(performance.now() - startTime);
        logger.log(
          `[${new Date().toISOString()}] [${requestId}] ${req.method} ${
            req.url
          } ` + `${responseInit.status} ${responseTime}ms`
        );

        return new Response(responseBody, responseInit);
      } catch (error) {
        // Handle errors
        const status = error instanceof ServerError ? error.status : 500;
        const message =
          error instanceof Error ? error.message : "Internal Server Error";

        logger.error(
          `[${new Date().toISOString()}] [${requestId}] ${req.method} ${
            req.url
          } `
        );

        // Return error response
        return new Response(message, {
          status,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        });
      }
    },
  });
} catch (error) {
  if (error instanceof Error && (error.message?.includes('address already in use') || error.message === 'EADDRINUSE')) {
    logger.error(`❌ Port ${mergedOptions.port} is already in use.`);
    logger.error(`💡 Try one of these solutions:`);
    logger.error(`   • Kill existing processes: lsof -ti:${mergedOptions.port} | xargs kill`);
    logger.error(`   • Use a different port: createServer({ port: ${mergedOptions.port + 1} })`);
    logger.error(`   • Check what's running: lsof -i :${mergedOptions.port}`);
    process.exit(1);
  }

    throw error;
}
  // Log server start
  logger.system(`
🚀 BextJS server started!
   • URL: http://${server.hostname}:${server.port}
   • Environment: ${process.env.NODE_ENV || "development"}
   • Routes: ${router.routes.length} routes registered
  `);

  // Add graceful shutdown handler
  process.on("SIGINT", () => {
    logger.log("\nShutting down server...");
    server.stop();
    process.exit(0);
  });

  return server;
}
