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
 * Data payload for the `gazette.processed` webhook event.
 */
export interface GazetteProcessedData {
  /** Number of gazette records processed */
  records_processed: number;
  /** Number of alert matches created */
  matches_created: number;
  /** IDs of the gazette editions that were processed */
  edition_ids: number[];
}

/**
 * Union type of all webhook event names.
 */
export type WebhookEventType = 'meeting.processed' | 'gazette.processed';

/**
 * Webhook payload sent by the HillMonitor platform.
 */
export type WebhookPayload =
  | { event: 'meeting.processed'; data: MeetingProcessedData }
  | { event: 'gazette.processed'; data: GazetteProcessedData };
