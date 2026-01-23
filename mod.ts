/**
 * HillMonitor Client SDK for Supabase Edge Functions.
 *
 * Provides shared utilities for building HillMonitor applications:
 * - Platform API client for accessing HillMonitor data
 * - RESTful resource handler factory
 * - Webhook handler with signature verification
 * - Authentication utilities
 * - CORS configuration
 * - Response helpers
 * - Supabase client factories
 *
 * @example
 * ```typescript
 * import {
 *   serveResource,
 *   createCorsHandler,
 *   verifyAuth,
 *   successResponse,
 * } from "@hillmonitor/client";
 *
 * const cors = createCorsHandler([
 *   'http://localhost:3000',
 *   'https://myapp.example.com',
 * ]);
 *
 * serveResource({
 *   platformPath: '/api/v1/alerts/',
 *   cors,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Webhook handler
 * import { serveWebhook } from "@hillmonitor/client";
 *
 * serveWebhook({
 *   onMeetingProcessed: async (meetingId) => {
 *     await triggerEmailProcessing(meetingId);
 *   },
 * });
 * ```
 *
 * @module
 */

// Platform types
export type {
  Speaker,
  Segment,
  Committee,
  Meeting,
  AlertMatch,
  FullMeetingResponse,
  MatchGroup,
} from './src/platform-types.ts';

// Auth types and functions
export type { AuthUser, AuthResult } from './src/auth.ts';
export { verifyAuth } from './src/auth.ts';

// CORS types and functions
export type { CorsHandler } from './src/cors.ts';
export { createCorsHandler } from './src/cors.ts';

// Platform client types and functions
export type { PlatformRequestOptions, PlatformResponse } from './src/platform-client.ts';
export { platformRequest, getFullMeeting, isPlatformConfigured } from './src/platform-client.ts';

// Resource handler types and functions
export type { RequestContext, HandlerFn, ResourceConfig } from './src/resource-handler.ts';
export { serveResource } from './src/resource-handler.ts';

// Supabase client functions
export { createServiceClient, createAuthenticatedClient } from './src/supabase-client.ts';

// Response utilities
export {
  jsonResponse,
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  methodNotAllowedResponse,
  serverErrorResponse,
  timeoutResponse,
} from './src/response.ts';

// Webhook types
export type {
  WebhookPayload,
  MeetingProcessedData,
  WebhookEventType,
} from './src/webhook/types.ts';

// Webhook verification
export { verifyWebhookSignature } from './src/webhook/verification.ts';

// Webhook handler types and functions
export type { WebhookConfig, WebhookContext } from './src/webhook/handler.ts';
export { serveWebhook } from './src/webhook/handler.ts';
