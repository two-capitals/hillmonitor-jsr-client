/**
 * Webhook payload types for HillMonitor platform webhooks.
 *
 * @module
 */

/**
 * Data payload for the `meeting.processed` webhook event.
 */
export interface MeetingProcessedData {
  /** The ID of the meeting that was processed */
  meeting_id: number;
}

/**
 * Union type of all webhook event names.
 */
export type WebhookEventType = 'meeting.processed';

/**
 * Webhook payload sent by the HillMonitor platform.
 */
export interface WebhookPayload {
  /** The event type */
  event: WebhookEventType;
  /** Event-specific data */
  data: MeetingProcessedData;
}
