/**
 * Configurable CORS utilities for Edge Functions.
 *
 * Unlike hardcoded CORS handlers, this module provides a factory function
 * that creates CORS handlers with app-specific allowed origins.
 *
 * @example
 * ```typescript
 * import { createCorsHandler } from "@hillmonitor/client";
 *
 * const { getCorsHeaders, handleCorsPrelight } = createCorsHandler([
 *   'http://localhost:3000',
 *   'https://myapp.example.com',
 * ]);
 * ```
 *
 * @module
 */

const ALLOWED_METHODS = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';

/**
 * CORS handler functions returned by {@link createCorsHandler}.
 */
export interface CorsHandler {
  /**
   * Gets CORS headers based on request origin.
   *
   * @param origin - The Origin header from the request
   * @returns Headers object with CORS configuration
   */
  getCorsHeaders: (origin: string | null) => Record<string, string>;

  /**
   * Handles CORS preflight (OPTIONS) requests.
   *
   * @param origin - The Origin header from the request
   * @returns Response with CORS headers
   */
  handleCorsPrelight: (origin: string | null) => Response;
}

/**
 * Creates a CORS handler configured with the specified allowed origins.
 *
 * @param allowedOrigins - Array of allowed origin URLs
 * @returns Object with getCorsHeaders and handleCorsPrelight functions
 *
 * @example
 * ```typescript
 * const { getCorsHeaders, handleCorsPrelight } = createCorsHandler([
 *   'http://localhost:5173',
 *   'https://app.example.com',
 * ]);
 *
 * // In your Edge Function:
 * if (req.method === 'OPTIONS') {
 *   return handleCorsPrelight(req.headers.get('Origin'));
 * }
 * ```
 */
export function createCorsHandler(allowedOrigins: string[]): CorsHandler {
  function getCorsHeaders(origin: string | null): Record<string, string> {
    const isAllowed = origin && allowedOrigins.includes(origin);

    return {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
    };
  }

  function handleCorsPrelight(origin: string | null = null): Response {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  return { getCorsHeaders, handleCorsPrelight };
}
