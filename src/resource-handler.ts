/**
 * Resource Handler Factory for Edge Functions.
 *
 * Creates a fully-featured RESTful handler with standard CRUD operations.
 * Each edge function only needs to specify configuration.
 *
 * @example
 * ```typescript
 * import { serveResource, createCorsHandler } from "@hillmonitor/client";
 *
 * const cors = createCorsHandler([
 *   'http://localhost:3000',
 *   'https://myapp.example.com',
 * ]);
 *
 * serveResource({
 *   platformPath: '/api/v1/alerts/',
 *   operations: 'all',
 *   cors,
 * });
 * ```
 *
 * @module
 */

import { verifyAuth } from './auth.ts';
import { isPlatformConfigured, platformRequest } from './platform-client.ts';
import {
  jsonResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  methodNotAllowedResponse,
  serverErrorResponse,
  errorResponse,
} from './response.ts';
import type { CorsHandler } from './cors.ts';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Context passed to custom handlers.
 */
export interface RequestContext {
  /** The original request */
  req: Request;
  /** CORS headers for this request */
  corsHeaders: Record<string, string>;
  /** Authenticated user ID */
  userId: string;
  /** Resource ID from URL path, or null for collection endpoints */
  resourceId: string | null;
  /** Parsed request body, or null for GET/DELETE */
  body: Record<string, unknown> | null;
  /** URL search parameters */
  params: URLSearchParams;
}

/**
 * Custom handler function signature.
 */
export type HandlerFn = (ctx: RequestContext) => Promise<Response>;

/**
 * Configuration for a RESTful resource endpoint.
 */
export interface ResourceConfig {
  /** Platform API base path (e.g., '/api/v1/alerts/') */
  platformPath: string;

  /** CORS handler created with createCorsHandler() */
  cors: CorsHandler;

  /**
   * Enabled operations. Defaults to all for full CRUD.
   * - 'all': list, get, create, update, delete
   * - 'read': list, get only
   * - Array: specific operations to enable
   */
  operations?: 'all' | 'read' | ('list' | 'get' | 'create' | 'update' | 'delete')[];

  /**
   * Custom handler overrides. Use these to customize specific operations
   * while keeping the defaults for others.
   */
  handlers?: {
    list?: HandlerFn;
    get?: HandlerFn;
    create?: HandlerFn;
    update?: HandlerFn;
    delete?: HandlerFn;
  };
}

/**
 * Extracts the resource ID from the URL path.
 */
function extractResourceId(req: Request): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length >= 2) {
    return pathParts[pathParts.length - 1];
  }

  return null;
}

/**
 * Converts URLSearchParams to a plain object.
 */
function paramsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * Creates default CRUD handlers for a resource.
 */
function createDefaultHandlers(platformPath: string) {
  return {
    /** GET / - List resources */
    async list(ctx: RequestContext): Promise<Response> {
      const params = paramsToObject(ctx.params);

      const { data, status } = await platformRequest({
        path: platformPath,
        method: 'GET',
        params,
        userId: ctx.userId,
      });

      return jsonResponse(data, status, ctx.corsHeaders);
    },

    /** GET /:id - Get single resource */
    async get(ctx: RequestContext): Promise<Response> {
      const { data, status } = await platformRequest({
        path: `${platformPath}${ctx.resourceId}/`,
        method: 'GET',
        userId: ctx.userId,
      });

      return jsonResponse(data, status, ctx.corsHeaders);
    },

    /** POST / - Create resource */
    async create(ctx: RequestContext): Promise<Response> {
      if (!ctx.body) {
        return badRequestResponse('Request body is required', ctx.corsHeaders);
      }

      const { data, status } = await platformRequest({
        path: platformPath,
        method: 'POST',
        body: ctx.body,
        userId: ctx.userId,
      });

      return jsonResponse(data, status, ctx.corsHeaders);
    },

    /** PATCH /:id - Update resource */
    async update(ctx: RequestContext): Promise<Response> {
      if (!ctx.body) {
        return badRequestResponse('Request body is required', ctx.corsHeaders);
      }

      const { data, status } = await platformRequest({
        path: `${platformPath}${ctx.resourceId}/`,
        method: 'PATCH',
        body: ctx.body,
        userId: ctx.userId,
      });

      return jsonResponse(data, status, ctx.corsHeaders);
    },

    /** DELETE /:id - Delete resource */
    async delete(ctx: RequestContext): Promise<Response> {
      const { status } = await platformRequest({
        path: `${platformPath}${ctx.resourceId}/`,
        method: 'DELETE',
        userId: ctx.userId,
      });

      if (status === 204) {
        return noContentResponse(ctx.corsHeaders);
      }

      return jsonResponse(null, status, ctx.corsHeaders);
    },
  };
}

/**
 * Determines which operations are enabled based on config.
 */
function getEnabledOperations(
  config: ResourceConfig
): Set<'list' | 'get' | 'create' | 'update' | 'delete'> {
  const { operations = 'all' } = config;

  if (operations === 'all') {
    return new Set(['list', 'get', 'create', 'update', 'delete']);
  }

  if (operations === 'read') {
    return new Set(['list', 'get']);
  }

  return new Set(operations);
}

/**
 * Creates a RESTful resource handler with standard CRUD operations.
 *
 * Automatically handles:
 * - CORS preflight requests
 * - JWT authentication via Supabase
 * - Request routing based on HTTP method and resource ID
 * - Platform API proxying with user ID injection
 *
 * @param config - Resource configuration
 *
 * @example
 * ```typescript
 * // Full CRUD resource
 * serveResource({
 *   platformPath: '/api/v1/alerts/',
 *   cors: createCorsHandler(['http://localhost:3000']),
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Read-only resource
 * serveResource({
 *   platformPath: '/api/v1/meetings/',
 *   operations: 'read',
 *   cors: createCorsHandler(['http://localhost:3000']),
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom operations with override
 * serveResource({
 *   platformPath: '/api/v1/alerts/',
 *   operations: ['list', 'get', 'create'],
 *   cors: createCorsHandler(['http://localhost:3000']),
 *   handlers: {
 *     create: async (ctx) => {
 *       // Custom create logic
 *       return successResponse({ created: true }, ctx.corsHeaders);
 *     },
 *   },
 * });
 * ```
 */
export function serveResource(config: ResourceConfig): void {
  const { platformPath, cors, handlers: customHandlers = {} } = config;
  const enabledOps = getEnabledOperations(config);
  const defaultHandlers = createDefaultHandlers(platformPath);

  // Merge custom handlers with defaults
  const handlers = {
    list: enabledOps.has('list') ? (customHandlers.list ?? defaultHandlers.list) : undefined,
    get: enabledOps.has('get') ? (customHandlers.get ?? defaultHandlers.get) : undefined,
    create: enabledOps.has('create') ? (customHandlers.create ?? defaultHandlers.create) : undefined,
    update: enabledOps.has('update') ? (customHandlers.update ?? defaultHandlers.update) : undefined,
    delete: enabledOps.has('delete') ? (customHandlers.delete ?? defaultHandlers.delete) : undefined,
  };

  Deno.serve(async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    const corsHeaders = cors.getCorsHeaders(origin);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return cors.handleCorsPrelight(origin);
    }

    try {
      // Verify Platform API is configured
      if (!isPlatformConfigured()) {
        console.error('HILLMONITOR_SECRET_KEY is not set');
        return errorResponse('Platform API is not configured', 500, corsHeaders);
      }

      // Verify authentication
      const { user, error: authError } = await verifyAuth(req);
      if (authError || !user) {
        return unauthorizedResponse(corsHeaders);
      }

      // Extract resource ID from path
      const resourceId = extractResourceId(req);

      // Parse request body for mutations
      let body: Record<string, unknown> | null = null;
      if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
        try {
          body = await req.json();
        } catch {
          body = null;
        }
      }

      // Get URL search params
      const url = new URL(req.url);
      const params = url.searchParams;

      // Build context
      const ctx: RequestContext = {
        req,
        corsHeaders,
        userId: user.id,
        resourceId,
        body,
        params,
      };

      // Route to appropriate handler
      const method = req.method as HttpMethod;

      switch (method) {
        case 'GET':
          if (resourceId && handlers.get) {
            return await handlers.get(ctx);
          }
          if (!resourceId && handlers.list) {
            return await handlers.list(ctx);
          }
          break;

        case 'POST':
          if (!resourceId && handlers.create) {
            return await handlers.create(ctx);
          }
          break;

        case 'PATCH':
        case 'PUT':
          if (resourceId && handlers.update) {
            return await handlers.update(ctx);
          }
          break;

        case 'DELETE':
          if (resourceId && handlers.delete) {
            return await handlers.delete(ctx);
          }
          break;
      }

      return methodNotAllowedResponse(corsHeaders);
    } catch (err) {
      console.error('Error in resource handler:', err);
      return serverErrorResponse(corsHeaders, err as Error);
    }
  });
}
