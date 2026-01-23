/**
 * Configurable CORS utilities for Edge Functions.
 *
 * Set the `HILLMONITOR_ALLOWED_ORIGINS` environment variable to a comma-separated
 * list of origins, and CORS will be handled automatically for all handlers.
 *
 * @example
 * ```bash
 * # Set in Supabase project secrets:
 * HILLMONITOR_ALLOWED_ORIGINS=http://localhost:3000,https://myapp.example.com
 * ```
 *
 * @example
 * ```typescript
 * // Manual CORS configuration (if not using env var):
 * import { createCorsHandler } from "@hillmonitor/client";
 *
 * const cors = createCorsHandler([
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
 * Environment variable name for allowed origins.
 * Set this to a comma-separated list of origins to enable automatic CORS handling.
 */
const ALLOWED_ORIGINS_ENV = 'HILLMONITOR_ALLOWED_ORIGINS';

let cachedDefaultHandler: CorsHandler | null = null;

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

/**
 * Gets the default CORS handler from the HILLMONITOR_ALLOWED_ORIGINS environment variable.
 *
 * The environment variable should contain a comma-separated list of allowed origins.
 * The handler is cached after first creation for efficiency.
 *
 * @returns CorsHandler if HILLMONITOR_ALLOWED_ORIGINS is set, undefined otherwise
 *
 * @example
 * ```bash
 * # Set in your Supabase project secrets:
 * HILLMONITOR_ALLOWED_ORIGINS=http://localhost:3000,https://myapp.example.com
 * ```
 *
 * @example
 * ```typescript
 * // Then in your Edge Function, just use serveResource without cors:
 * serveResource({
 *   platformPath: '/api/v1/alerts/',
 *   // cors is automatically handled via HILLMONITOR_ALLOWED_ORIGINS
 * });
 * ```
 */
export function getDefaultCorsHandler(): CorsHandler | undefined {
  if (cachedDefaultHandler) {
    return cachedDefaultHandler;
  }

  const originsEnv = Deno.env.get(ALLOWED_ORIGINS_ENV);
  if (!originsEnv) {
    return undefined;
  }

  const origins = originsEnv.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins.length === 0) {
    return undefined;
  }

  cachedDefaultHandler = createCorsHandler(origins);
  return cachedDefaultHandler;
}
