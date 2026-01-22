/**
 * Authentication utilities for Edge Functions.
 *
 * Uses Supabase's asymmetric JWT verification pattern with getClaims().
 *
 * @example
 * ```typescript
 * import { verifyAuth } from "@hillmonitor/client";
 *
 * const { user, error } = await verifyAuth(req);
 * if (error) {
 *   return new Response("Unauthorized", { status: 401 });
 * }
 * console.log("User ID:", user.id);
 * ```
 *
 * @module
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Authenticated user information extracted from JWT claims.
 */
export interface AuthUser {
  /** Unique user identifier (UUID from Supabase Auth) */
  id: string;
  /** User's email address, if available */
  email?: string;
  /** Additional claims from the JWT */
  [key: string]: unknown;
}

/**
 * Result of an authentication attempt.
 */
export interface AuthResult {
  /** The authenticated user, or null if authentication failed */
  user: AuthUser | null;
  /** Error message if authentication failed, null on success */
  error: string | null;
}

/**
 * Verifies user authentication from a request's Authorization header.
 *
 * Uses Supabase's getClaims() for asymmetric JWT verification.
 * Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.
 *
 * @param req - The incoming request with Authorization header
 * @returns Authentication result with user data or error message
 *
 * @example
 * ```typescript
 * const { user, error } = await verifyAuth(req);
 * if (error || !user) {
 *   return unauthorizedResponse(origin);
 * }
 * // Use user.id for database queries
 * ```
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims?.sub) {
    console.error('JWT verification failed:', error?.message || 'No sub claim');
    return { user: null, error: 'Invalid JWT' };
  }

  const user: AuthUser = {
    id: data.claims.sub as string,
    email: data.claims.email as string | undefined,
    ...data.claims,
  };

  return { user, error: null };
}
