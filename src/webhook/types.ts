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
 * Data payload for the `govt_release.processed` webhook event.
 */
export interface GovtReleaseProcessedData {
  /** Number of government release records processed */
  records_processed: number;
  /** Number of alert matches created */
  matches_created: number;
  /** IDs of the government releases that were processed */
  release_ids: number[];
}

/**
 * Data payload for the `cpac_video.processed` webhook event.
 */
export interface CpacVideoProcessedData {
  /** Number of CPAC video records processed */
  records_processed: number;
  /** Number of alert matches created */
  matches_created: number;
  /** IDs of the CPAC videos that were processed */
  video_ids: number[];
}

/**
 * Data payload for the `social_post.processed` webhook event.
 */
export interface SocialPostProcessedData {
  /** Number of social posts processed */
  posts_processed: number;
  /** Number of alert matches created */
  matches_created: number;
  /** IDs of the social posts that were processed */
  post_ids: number[];
}

/**
 * Union type of all webhook event names.
 */
export type WebhookEventType = 'meeting.processed' | 'gazette.processed' | 'govt_release.processed' | 'cpac_video.processed' | 'social_post.processed';

/**
 * Webhook payload sent by the HillMonitor platform.
 */
export type WebhookPayload =
  | { event: 'meeting.processed'; data: MeetingProcessedData }
  | { event: 'gazette.processed'; data: GazetteProcessedData }
  | { event: 'govt_release.processed'; data: GovtReleaseProcessedData }
  | { event: 'cpac_video.processed'; data: CpacVideoProcessedData }
  | { event: 'social_post.processed'; data: SocialPostProcessedData };
