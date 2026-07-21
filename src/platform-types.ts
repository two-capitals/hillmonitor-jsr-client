/**
 * Platform API types for HillMonitor.
 *
 * These types represent the data structures returned by the HillMonitor Platform API
 * for meetings, alerts, and related entities.
 *
 * @module
 */

/**
 * A speaker in a parliamentary meeting segment.
 */
export interface Speaker {
  /** Unique identifier */
  id: number;
  /** Speaker's full name */
  name: string;
  /** Type of speaker (e.g., "MP", "Witness") */
  type: string;
  /** Political party affiliation */
  party: string;
  /** Organization the speaker represents */
  organization: string;
}

/**
 * A segment of a parliamentary meeting transcript.
 */
export interface Segment {
  /** Unique identifier */
  id: number;
  /** The speaker for this segment, or null if unknown */
  speaker: Speaker | null;
  /** ISO timestamp when the segment started */
  startTime: string;
  /** ISO timestamp when the segment ended */
  endTime: string;
  /** Full transcript text of the segment */
  transcript: string;
  /** English translation of the transcript, if available */
  transcriptEn?: string;
  /** URL to a thumbnail image for this segment */
  thumbnailUrl: string;
}

/**
 * A parliamentary committee.
 */
export interface Committee {
  /** Full committee name */
  name: string;
  /** Committee acronym (e.g., "FINA", "JUST") */
  acronym: string;
}

/**
 * A parliamentary committee meeting.
 */
export interface Meeting {
  /** Unique identifier */
  id: number;
  /** Date of the meeting (ISO date string) */
  meetingDate: string;
  /** The committee that held this meeting */
  committee: Committee;
  /** ParlVU meeting identifier */
  parlvuMeetingId: number;
  /** Direct link to the meeting on ParlVU */
  parlvuLink: string;
  /** ISO timestamp when the meeting started */
  meetingStartTime: string;
  /** Whether transcript processing is complete */
  hasCompletedProcessing: boolean;
  /** AI-generated summary of the meeting */
  summary: string;
}

/**
 * An alert match found in a meeting transcript.
 */
export interface AlertMatch {
  /** Unique identifier */
  id: number;
  /** ID of the alert that triggered this match */
  alert: number;
  /** The search phrase that was matched */
  phrase: string;
  /** External user ID who owns this alert */
  externalUserId: string;
  /** The source type of this match (e.g., "ca_house_of_representatives") */
  source: string;
  /** The actual text that matched the phrase */
  matchedText: string;
  /** Character position where the match starts in the segment */
  startPosition: number;
  /** Character position where the match ends in the segment */
  endPosition: number;
  /** ISO timestamp when the match was created */
  createdAt: string;
  /** The transcript segment containing this match */
  segment: Segment;
}

/**
 * Full meeting data including all alert matches.
 */
export interface FullMeetingResponse extends Meeting {
  /** All alert matches found in this meeting */
  alertMatches: AlertMatch[];
}

/**
 * A group of matches for a single search phrase.
 */
export interface MatchGroup {
  /** The search phrase */
  phrase: string;
  /** All matches for this phrase */
  matches: AlertMatch[];
}

/**
 * A Canada Gazette edition.
 */
export interface GazetteEdition {
  /** Unique identifier */
  id: number;
  /** Date of the edition (ISO date string) */
  editionDate: string;
  /** Volume number */
  volume: number;
  /** Issue number within the volume */
  issueNumber: number;
  /** URL to the edition on the Canada Gazette website */
  editionUrl: string;
}

/**
 * An item published in the Canada Gazette.
 */
export interface GazetteItem {
  /** Unique identifier */
  id: number;
  /** UUID identifier from the gazette system */
  gazetteId: string;
  /** Full text content of the gazette item */
  contentText: string;
  /** The edition this item belongs to */
  edition: GazetteEdition;
  /** Title of the gazette item */
  itemTitle: string;
  /** URL to the item on the Canada Gazette website */
  itemUrl: string;
  /** Type of section (e.g., "Notices", "Regulations") */
  sectionType: string;
  /** Department or agency that published the item */
  departmentAgency: string;
}

/**
 * An alert match found in a Canada Gazette item.
 */
export interface GazetteAlertMatch {
  /** Unique identifier */
  id: number;
  /** ID of the alert that triggered this match */
  alert: number;
  /** The search phrase that was matched */
  phrase: string;
  /** External user ID who owns this alert */
  externalUserId: string;
  /** The source type of this match */
  source: 'canada_gazette';
  /** The actual text that matched the phrase */
  matchedText: string;
  /** Character position where the match starts */
  startPosition: number;
  /** Character position where the match ends */
  endPosition: number;
  /** ISO timestamp when the match was created */
  createdAt: string;
  /** The gazette item containing this match */
  gazetteItem: GazetteItem;
}

/**
 * A government news release.
 */
export interface GovtRelease {
  /** Unique identifier */
  id: number;
  /** UUID identifier from the release system */
  releaseId: string;
  /** Title of the release */
  title: string;
  /** URL to the release on Canada.ca */
  url: string;
  /** Date the release was published (ISO date string) */
  publishedDate: string;
  /** Government department that published the release */
  department: string;
  /** Type of release (e.g., "news_release", "statement") */
  releaseType: string;
  /** Full text content of the release */
  contentText: string;
}

/**
 * An alert match found in a government news release.
 */
export interface GovtReleaseAlertMatch {
  /** Unique identifier */
  id: number;
  /** ID of the alert that triggered this match */
  alert: number;
  /** The search phrase that was matched */
  phrase: string;
  /** External user ID who owns this alert */
  externalUserId: string;
  /** The source type of this match */
  source: 'govt_news';
  /** The actual text that matched the phrase */
  matchedText: string;
  /** Character position where the match starts */
  startPosition: number;
  /** Character position where the match ends */
  endPosition: number;
  /** ISO timestamp when the match was created */
  createdAt: string;
  /** The government release containing this match */
  govtRelease: GovtRelease;
}

/**
 * A CPAC video.
 */
export interface CpacVideo {
  /** Unique identifier */
  id: number;
  /** CPAC video identifier */
  videoId: string;
  /** Video title */
  title: string;
  /** Video category */
  category: string;
  /** Video description */
  description: string;
  /** AI-generated summary */
  summary: string;
  /** Date the video premiered (ISO date string), or null */
  premiereDate: string | null;
  /** URL to the video on CPAC */
  videoUrl: string;
  /** URL to the episode page on CPAC */
  episodeUrl: string;
  /** Video duration */
  duration: string;
  /** ISO timestamp when processing completed */
  completedAt: string;
}

/**
 * A segment of a CPAC video transcript.
 */
export interface CpacVideoSegment {
  /** Unique identifier */
  id: number;
  /** Transcript text of the segment */
  text: string;
  /** Speaker name */
  speaker: string;
  /** Start time of the segment */
  startTime: string;
  /** End time of the segment */
  endTime: string;
  /** Language of the segment */
  language: string;
  /** Source of the segment */
  source: string;
  /** URL of the segment thumbnail image */
  thumbnailUrl: string;
}

/**
 * An alert match found in a CPAC video segment.
 */
export interface CpacVideoAlertMatch {
  /** Unique identifier */
  id: number;
  /** ID of the alert that triggered this match */
  alert: number;
  /** The search phrase that was matched */
  phrase: string;
  /** External user ID who owns this alert */
  externalUserId: string;
  /** The source type of this match */
  source: 'cpac_video';
  /** The actual text that matched the phrase */
  matchedText: string;
  /** Character position where the match starts */
  startPosition: number;
  /** Character position where the match ends */
  endPosition: number;
  /** ISO timestamp when the match was created */
  createdAt: string;
  /** The CPAC video containing this match */
  cpacVideo: CpacVideo;
  /** The CPAC video segment containing this match */
  cpacVideoSegment: CpacVideoSegment;
}

/**
 * A social media post authored by a parliamentarian.
 */
export interface SocialPost {
  /** Unique identifier */
  id: number;
  /** Platform-native post id (e.g. the tweet id) */
  postId: string;
  /** Platform the post was published on (e.g. "x") */
  platform: string;
  /** ID of the linked speaker (MP), if resolved */
  speaker: number | null;
  /** Display name of the linked speaker, if resolved */
  speakerName: string | null;
  /** Handle without the leading @ */
  username: string;
  /** Full text content of the post */
  text: string;
  /** URL to the post on the source platform */
  url: string;
  /** ISO timestamp when the post was published */
  postedAt: string;
  /** ISO timestamp when the post was fetched */
  fetchedAt: string;
}

/**
 * An alert match found in a parliamentarian's social media post.
 */
export interface SocialPostAlertMatch {
  /** Unique identifier */
  id: number;
  /** ID of the alert that triggered this match */
  alert: number;
  /** The search phrase that was matched */
  phrase: string;
  /** External user ID who owns this alert */
  externalUserId: string;
  /** The source type of this match */
  source: 'mp_social';
  /** The actual text that matched the phrase */
  matchedText: string;
  /** Character position where the match starts */
  startPosition: number;
  /** Character position where the match ends */
  endPosition: number;
  /** ISO timestamp when the match was created */
  createdAt: string;
  /** The social post containing this match */
  socialPost: SocialPost;
}

