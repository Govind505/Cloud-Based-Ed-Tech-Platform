/**
 * Analytics Types
 * Defines interfaces for analytics and monitoring data
 */

export enum AnalyticsEventType {
  STREAM_START = 'stream_start',
  STREAM_END = 'stream_end',
  QUALITY_CHANGE = 'quality_change',
  BUFFER_EVENT = 'buffer_event',
  ERROR = 'error',
  OFFLINE_SYNC = 'offline_sync',
}

export interface IAnalyticsEvent {
  _id?: string;
  userId: string;
  videoId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  timestamp: Date;
  bandwidth?: number; // kbps
  deviceType?: string; // mobile, tablet, desktop
  platform?: string; // iOS, Android, Web
}

export interface IVideoMetrics {
  videoId: string;
  totalViews: number;
  totalMinutesWatched: number;
  averageQuality: string;
  bufferingEventCount: number;
  averageStartupTime: number; // seconds
  completionRate: number; // percentage
}

export interface IBandwidthMetrics {
  timestamp: Date;
  minBandwidth: number;
  maxBandwidth: number;
  avgBandwidth: number;
  p95Bandwidth: number;
  p99Bandwidth: number;
  qualityDistribution: Record<string, number>; // quality -> count
}
