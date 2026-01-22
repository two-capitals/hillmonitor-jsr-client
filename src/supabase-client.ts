/**
 * Supabase client factories for Edge Functions.
 *
 * Provides utilities to create Supabase clients for different use cases:
 * - Service client (bypasses RLS) for admin operations
 * - Authenticated client (respects RLS) for user-scoped operations
 *
 * @example
 * ```typescript
 * import { createServiceClient, createAuthenticatedClient } from "@hillmonitor/client";
 *
 * // Admin operations (bypasses RLS)
 * const adminClient = createServiceClient();
 *
 * // User-scoped operations (respects RLS)
 * const userClient = createAuthenticatedClient(req.headers.get('Authorization')!);
 * ```
 *
 * @module
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side operations.
 *
 * Uses the service role key which bypasses Row Level Security (RLS).
 * Use this for admin operations that need access to all data.
 *
 * Requires environment variables:
 * - `SUPABASE_URL`
 * - `SUPABASE_SERVICE_ROLE_KEY`
 *
 * @returns Supabase client with service role privileges
 *
 * @example
 * ```typescript
 * const supabase = createServiceClient();
 * const { data } = await supabase.from('users').select('*');
 * ```
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/**
 * Creates a Supabase client with user authentication context.
 *
 * Uses the anon key but passes the user's JWT, so RLS policies are applied
 * based on the authenticated user.
 *
 * Requires environment variables:
 * - `SUPABASE_URL`
 * - `SUPABASE_ANON_KEY`
 *
 * @param authHeader - The Authorization header from the request (e.g., "Bearer <token>")
 * @returns Supabase client configured with user's JWT
 *
 * @example
 * ```typescript
 * const authHeader = req.headers.get('Authorization');
 * const supabase = createAuthenticatedClient(authHeader!);
 * // This query respects RLS policies
 * const { data } = await supabase.from('my_items').select('*');
 * ```
 */
export function createAuthenticatedClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}
