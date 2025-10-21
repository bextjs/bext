/**
 * Base error class for BextJS framework errors
 */
export class BextError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Server-related errors
 */
export class ServerError extends BextError {
  constructor(
    message: string,
    status: number = 500,
    code?: string
  ) {
    super(message, code, status);
    this.name = "ServerError";
  }
}

/**
 * Route-related errors
 */
export class RouteError extends BextError {
  constructor(
    message: string,
    code: string,
    status?: number
  ) {
    super(message, code, status);
    this.name = "RouteError";
  }
}

/**
 * Route validation errors
 */
export class RouteValidationError extends BextError {
  constructor(
    message: string,
    code: string,
    public readonly field?: string
  ) {
    super(message, code);
    this.name = "RouteValidationError";
  }
}
