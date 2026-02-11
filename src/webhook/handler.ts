/**
 * Webhook Handler Factory for Edge Functions.
 *
 * Creates a webhook handler that verifies signatures and routes events
 * to registered callbacks.
 *
 * Set the `HILLMONITOR_ALLOWED_ORIGINS` environment variable to handle CORS
 * automatically.
 *
 * @example
 * ```typescript
 * import { serveWebhook } from "@hillmonitor/client";
 *
 * // CORS handled via HILLMONITOR_ALLOWED_ORIGINS env var
 * serveWebhook({
 *   onMeetingProcessed: async (meetingId, ctx) => {
 *     console.log(`Meeting ${meetingId} was processed`);
 *   },
 * });
 * ```
 *
 * @module
 */

import { verifyWebhookSignature } from './verification.ts';
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  methodNotAllowedResponse,
  serverErrorResponse,
} from '../response.ts';
import type { CorsHandler } from '../cors.ts';
import { getDefaultCorsHandler } from '../cors.ts';
import type { WebhookPayload, GazetteProcessedData } from './types.ts';

/**
 * Context passed to webhook event handlers.
 */
export interface WebhookContext {
  /** The original request */
  req: Request;
  /** CORS headers for this request */
  corsHeaders: Record<string, string>;
  /** The full webhook payload */
  payload: WebhookPayload;
}

/**
 * Configuration for the webhook handler.
 */
export interface WebhookConfig {
  /**
   * CORS handler created with createCorsHandler().
   * If not provided, uses HILLMONITOR_ALLOWED_ORIGINS environment variable.
   */
  cors?: CorsHandler;

  /**
   * Webhook secret for signature verification.
   * Defaults to HILLMONITOR_WEBHOOK_SECRET environment variable.
   */
  secret?: string;

  /**
   * Handler for `meeting.processed` events.
   *
   * @param meetingId - The ID of the processed meeting
   * @param context - The webhook context
   */
  onMeetingProcessed?: (meetingId: number, context: WebhookContext) => Promise<void>;

  /**
   * Handler for `gazette.processed` events.
   *
   * @param data - The gazette processing data including edition IDs
   * @param context - The webhook context
   */
  onGazetteProcessed?: (data: GazetteProcessedData, context: WebhookContext) => Promise<void>;
}

/**
 * Creates a webhook handler that verifies signatures and routes events.
 *
 * Automatically handles:
 * - CORS preflight requests (if cors is provided)
 * - HMAC-SHA256 signature verification
 * - Event routing to registered callbacks
 *
 * @param config - Webhook handler configuration
 *
 * @example
 * ```typescript
 * serveWebhook({
 *   onMeetingProcessed: async (meetingId) => {
 *     await triggerEmailProcessing(meetingId);
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With CORS support
 * serveWebhook({
 *   cors: createCorsHandler(['https://platform.hillmonitor.com']),
 *   onMeetingProcessed: async (meetingId, ctx) => {
 *     console.log('Payload:', ctx.payload);
 *   },
 * });
 * ```
 */
export function serveWebhook(config: WebhookConfig): void {
  const { onMeetingProcessed, onGazetteProcessed } = config;
  const cors = config.cors ?? getDefaultCorsHandler();
  const secret = config.secret ?? Deno.env.get('HILLMONITOR_WEBHOOK_SECRET');

  Deno.serve(async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    const corsHeaders = cors?.getCorsHeaders(origin) ?? {};

    // Handle CORS preflight
    if (req.method === 'OPTIONS' && cors) {
      return cors.handleCorsPrelight(origin);
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return methodNotAllowedResponse(corsHeaders);
    }

    try {
      // Verify webhook secret is configured
      if (!secret) {
        console.error('HILLMONITOR_WEBHOOK_SECRET is not set');
        return serverErrorResponse(corsHeaders);
      }

      // Read and verify the payload
      const body = await req.text();
      const signature = req.headers.get('X-HillMonitor-Signature');

      try {
        await verifyWebhookSignature(body, signature, secret);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      // Parse the payload
      let payload: WebhookPayload;
      try {
        payload = JSON.parse(body) as WebhookPayload;
      } catch {
        return badRequestResponse('Invalid JSON payload', corsHeaders);
      }

      // Build context
      const ctx: WebhookContext = {
        req,
        corsHeaders,
        payload,
      };

      // Route to appropriate handler
      switch (payload.event) {
        case 'meeting.processed':
          if (onMeetingProcessed) {
            await onMeetingProcessed(payload.data.meeting_id, ctx);
          }
          break;
        case 'gazette.processed':
          if (onGazetteProcessed) {
            await onGazetteProcessed(payload.data, ctx);
          }
          break;
        default:
          console.warn(`Unhandled webhook event: ${(payload as { event: string }).event}`);
      }

      return successResponse({ received: true }, corsHeaders);
    } catch (err) {
      console.error('Error in webhook handler:', err);
      return serverErrorResponse(corsHeaders, err as Error);
    }
  });
}
