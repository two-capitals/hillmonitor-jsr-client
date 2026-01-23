/**
 * Webhook signature verification for HillMonitor platform webhooks.
 *
 * @module
 */

/**
 * Verifies the HMAC-SHA256 signature of a webhook payload.
 *
 * @param payload - The raw request body as a string
 * @param signature - The signature from the X-HillMonitor-Signature header (format: "sha256=hexdigest")
 * @param secret - The webhook secret key
 * @throws Error if the signature is invalid
 *
 * @example
 * ```typescript
 * const body = await req.text();
 * const signature = req.headers.get('X-HillMonitor-Signature');
 *
 * await verifyWebhookSignature(body, signature, secret);
 * // If we get here, signature is valid
 * ```
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<void> {
  if (!signature) {
    throw new Error('Missing webhook signature');
  }

  // Extract hex signature from "sha256=hexdigest" format
  if (!signature.startsWith('sha256=')) {
    throw new Error('Invalid signature format: expected sha256= prefix');
  }
  const receivedSignature = signature.slice(7);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (receivedSignature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }
}
