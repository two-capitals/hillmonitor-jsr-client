/**
 * Response utilities for Edge Functions.
 *
 * Provides standardized JSON response helpers that accept CORS headers.
 * Use with {@link createCorsHandler} to generate the headers.
 *
 * @example
 * ```typescript
 * import { createCorsHandler, successResponse, errorResponse } from "@hillmonitor/client";
 *
 * const { getCorsHeaders } = createCorsHandler(['http://localhost:3000']);
 * const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
 *
 * // Success response
 * return successResponse({ id: 1, name: "Test" }, corsHeaders);
 *
 * // Error response
 * return errorResponse("Not found", 404, corsHeaders);
 * ```
 *
 * @module
 */

/**
 * Creates a JSON response with the provided headers.
 *
 * @param data - Response body data
 * @param status - HTTP status code
 * @param corsHeaders - CORS headers from getCorsHeaders()
 * @returns Response with JSON body and headers
 */
export function jsonResponse<T>(
  data: T,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Creates a success response (200 OK).
 *
 * @param data - Response body data
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function successResponse<T>(
  data: T,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse(data, 200, corsHeaders);
}

/**
 * Creates a created response (201 Created).
 *
 * @param data - Response body data
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function createdResponse<T>(
  data: T,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse(data, 201, corsHeaders);
}

/**
 * Creates a no content response (204 No Content).
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function noContentResponse(corsHeaders: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Creates an error response with the given status code.
 *
 * In development mode (ENVIRONMENT=development), additional error details
 * are included in the response.
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param corsHeaders - CORS headers from getCorsHeaders()
 * @param details - Optional additional error details (only shown in development)
 */
export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  details?: string
): Response {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

  return jsonResponse(
    {
      error: message,
      ...(isDevelopment && details && { details }),
    },
    status,
    corsHeaders
  );
}

/**
 * Creates a 400 Bad Request response.
 *
 * @param message - Error message describing what was wrong with the request
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function badRequestResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return errorResponse(message, 400, corsHeaders);
}

/**
 * Creates a 401 Unauthorized response.
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return errorResponse('Unauthorized', 401, corsHeaders);
}

/**
 * Creates a 404 Not Found response.
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function notFoundResponse(corsHeaders: Record<string, string>): Response {
  return errorResponse('Not found', 404, corsHeaders);
}

/**
 * Creates a 405 Method Not Allowed response.
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function methodNotAllowedResponse(corsHeaders: Record<string, string>): Response {
  return errorResponse('Method not allowed', 405, corsHeaders);
}

/**
 * Creates a 500 Internal Server Error response.
 *
 * In development mode, the error message and stack trace are included.
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 * @param error - Optional Error object for additional details in development
 */
export function serverErrorResponse(
  corsHeaders: Record<string, string>,
  error?: Error
): Response {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

  return errorResponse(
    isDevelopment && error ? error.message : 'Internal server error',
    500,
    corsHeaders,
    isDevelopment && error ? error.toString() : undefined
  );
}

/**
 * Creates a 504 Gateway Timeout response.
 *
 * @param corsHeaders - CORS headers from getCorsHeaders()
 */
export function timeoutResponse(corsHeaders: Record<string, string>): Response {
  return errorResponse('Request timeout', 504, corsHeaders);
}
