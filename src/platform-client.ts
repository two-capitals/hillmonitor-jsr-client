/**
 * Platform API client for Edge Functions.
 *
 * Handles authenticated requests to the HillMonitor Platform API
 * with automatic user ID injection.
 *
 * @example
 * ```typescript
 * import { platformRequest, getFullMeeting, isPlatformConfigured } from "@hillmonitor/client";
 *
 * // Check if API is configured
 * if (!isPlatformConfigured()) {
 *   throw new Error("Platform API not configured");
 * }
 *
 * // Make a request with user context
 * const { data, status } = await platformRequest({
 *   path: '/api/v1/alerts/',
 *   method: 'GET',
 *   userId: user.id,
 * });
 *
 * // Get full meeting data
 * const { data: meeting } = await getFullMeeting(123);
 * ```
 *
 * @module
 */

import type { FullMeetingResponse } from './platform-types.ts';

const REQUEST_TIMEOUT_MS = 30000;

/**
 * Options for making a Platform API request.
 */
export interface PlatformRequestOptions {
  /** Platform API path (e.g., '/api/v1/alerts/') */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request body for POST/PATCH/PUT */
  body?: Record<string, unknown>;
  /** User ID to inject into requests */
  userId: string;
}

/**
 * Response from a Platform API request.
 */
export interface PlatformResponse<T = unknown> {
  /** Response data, or null if request failed */
  data: T | null;
  /** HTTP status code */
  status: number;
  /** Error message if request failed */
  error?: string;
}

/**
 * Checks if the HillMonitor API is properly configured.
 *
 * Verifies that `HILLMONITOR_SECRET_KEY` environment variable is set.
 *
 * @returns true if HillMonitor API can be used
 */
export function isPlatformConfigured(): boolean {
  return !!Deno.env.get('HILLMONITOR_SECRET_KEY');
}

/**
 * Makes an authenticated request to the Platform API.
 *
 * - Automatically adds external_user_id to query params (GET) or body (POST/PATCH/PUT)
 * - Adds Bearer authentication with HILLMONITOR_SECRET_KEY
 * - Implements request timeout (30 seconds)
 *
 * Requires environment variables:
 * - `HILLMONITOR_API_URL` (optional, defaults to 'https://api.hillmonitor.ca')
 * - `HILLMONITOR_SECRET_KEY`
 *
 * @param options - Request configuration
 * @returns Response data and status
 *
 * @example
 * ```typescript
 * // List alerts for a user
 * const { data, status } = await platformRequest({
 *   path: '/api/v1/alerts/',
 *   method: 'GET',
 *   userId: 'user-123',
 * });
 *
 * // Create a new alert
 * const { data, status } = await platformRequest({
 *   path: '/api/v1/alerts/',
 *   method: 'POST',
 *   body: { phrase: 'climate change' },
 *   userId: 'user-123',
 * });
 * ```
 */
export async function platformRequest<T = unknown>(
  options: PlatformRequestOptions
): Promise<PlatformResponse<T>> {
  const HILLMONITOR_API_URL = Deno.env.get('HILLMONITOR_API_URL') || 'https://api.hillmonitor.ca';
  const HILLMONITOR_SECRET_KEY = Deno.env.get('HILLMONITOR_SECRET_KEY');

  const { path, method, params = {}, body, userId } = options;

  // Build query string
  const searchParams = new URLSearchParams();

  // Add user-provided params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  // Add external_user_id for GET requests
  if (method === 'GET') {
    searchParams.set('external_user_id', userId);
  }

  const queryString = searchParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  const url = `${HILLMONITOR_API_URL}${fullPath}`;

  // Prepare request body with user ID for mutations
  let requestBody = body;
  if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && body) {
    requestBody = {
      ...body,
      external_user_id: userId,
    };
  }

  // Prepare headers
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${HILLMONITOR_SECRET_KEY}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  console.log(`[platform-client] ${method} ${fullPath}`);

  // Execute request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Parse response
    const responseText = await response.text();
    let data: T | null = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Response is not JSON, return as-is
      data = responseText as unknown as T;
    }

    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    if ((error as Error).name === 'AbortError') {
      return { data: null, status: 504, error: 'Request timeout' };
    }

    throw error;
  }
}

/**
 * Fetches full meeting data with all alert matches.
 *
 * This is an organization-level request that does not filter by user.
 * Used for generating email notifications and reports.
 *
 * @param meetingId - The meeting ID to fetch
 * @returns Full meeting data including all alert matches
 *
 * @example
 * ```typescript
 * const { data, status, error } = await getFullMeeting(123);
 * if (data) {
 *   console.log(`Meeting: ${data.committee.name}`);
 *   console.log(`Matches: ${data.alertMatches.length}`);
 * }
 * ```
 */
export async function getFullMeeting(
  meetingId: number
): Promise<PlatformResponse<FullMeetingResponse>> {
  const HILLMONITOR_API_URL = Deno.env.get('HILLMONITOR_API_URL') || 'https://api.hillmonitor.ca';
  const HILLMONITOR_SECRET_KEY = Deno.env.get('HILLMONITOR_SECRET_KEY');

  const url = `${HILLMONITOR_API_URL}/api/v1/meetings/${meetingId}/full/`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${HILLMONITOR_SECRET_KEY}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  console.log(`[platform-client] GET /api/v1/meetings/${meetingId}/full/`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { data: null, status: response.status, error: `HTTP ${response.status}` };
    }

    const data: FullMeetingResponse = await response.json();
    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    if ((error as Error).name === 'AbortError') {
      return { data: null, status: 504, error: 'Request timeout' };
    }

    throw error;
  }
}
