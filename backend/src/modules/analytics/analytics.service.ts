import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent } from './schemas/analytics-event.schema';
import { TrackEventDto, VideoMetricsResponseDto } from './dto/analytics.dto';
import { AnalyticsEventType } from '../../types/analytics.types';
import { UsersService } from '../users/users.service';

/**
 * Analytics Service
 * Tracks and analyzes user events
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name) private eventModel: Model<AnalyticsEvent>,
    private usersService: UsersService,
  ) {}

  /**
   * Get User Statistics
   */
  async getUserStats(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    const events = await this.eventModel.find({ userId }).sort({ timestamp: -1 });

    const streamStarts = events.filter((e) => e.eventType === AnalyticsEventType.STREAM_START);
    const streamEnds = events.filter((e) => e.eventType === AnalyticsEventType.STREAM_END);

    const totalWatchTimeMinutes = this.calculateTotalMinutes(streamStarts, streamEnds);
    const completedCourses = streamEnds.length;
    const inProgressCourses = user.enrolledCourses?.length || 0;
    const badgesEarned = Math.floor(completedCourses / 2) + 1; // Arbitrary logic for badges

    // Map recent activity from events
    const recentActivity = events.slice(0, 5).map(e => {
      let type: 'completed' | 'started' | 'badge' = 'started';
      let title = `Watched video ${e.videoId}`;
      
      if (e.eventType === AnalyticsEventType.STREAM_END) {
        type = 'completed';
        title = `Finished video ${e.videoId}`;
      } else if (e.eventType === AnalyticsEventType.QUALITY_CHANGE) {
        title = `Changed quality on ${e.videoId}`;
      }

      return {
        id: e._id.toString(),
        type,
        title,
        timestamp: e.timestamp,
      };
    });

    return {
      totalWatchTimeMinutes,
      completedCourses,
      inProgressCourses,
      badgesEarned,
      recentActivity,
    };
  }

  /**
   * Track an analytics event
   */
  async trackEvent(userId: string, trackEventDto: TrackEventDto): Promise<void> {
    const event = new this.eventModel({
      userId,
      ...trackEventDto,
      timestamp: new Date(),
    });

    await event.save();
    this.logger.debug(`Event tracked: ${trackEventDto.eventType} for video ${trackEventDto.videoId}`);
  }

  /**
   * Get video metrics
   */
  async getVideoMetrics(videoId: string): Promise<VideoMetricsResponseDto> {
    const events = await this.eventModel.find({ videoId });

    const streamStarts = events.filter((e) => e.eventType === AnalyticsEventType.STREAM_START);
    const streamEnds = events.filter((e) => e.eventType === AnalyticsEventType.STREAM_END);
    const bufferEvents = events.filter((e) => e.eventType === AnalyticsEventType.BUFFER_EVENT);

    // Calculate metrics
    const totalViews = streamStarts.length;
    const totalMinutesWatched = this.calculateTotalMinutes(streamStarts, streamEnds);
    const averageQuality = this.calculateAverageQuality(events);
    const bufferingEventCount = bufferEvents.length;
    const averageStartupTime = this.calculateAverageStartupTime(events);
    const completionRate = this.calculateCompletionRate(streamStarts, streamEnds);

    return {
      videoId,
      totalViews,
      totalMinutesWatched,
      averageQuality,
      bufferingEventCount,
      averageStartupTime,
      completionRate,
    };
  }

  /**
   * Calculate total minutes watched
   */
  private calculateTotalMinutes(starts: AnalyticsEvent[], ends: AnalyticsEvent[]): number {
    let total = 0;
    for (const start of starts) {
      const end = ends.find((e) => e.userId === start.userId && e.videoId === start.videoId);
      if (end) {
        const duration = (end.timestamp.getTime() - start.timestamp.getTime()) / 1000 / 60;
        total += duration;
      }
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * Calculate average quality
   */
  private calculateAverageQuality(events: AnalyticsEvent[]): string {
    const qualityEvents = events.filter((e) => e.eventType === AnalyticsEventType.QUALITY_CHANGE);
    if (qualityEvents.length === 0) return '360p';

    const qualityMap: Record<string, number> = {};
    qualityEvents.forEach((e) => {
      const quality = e.eventData?.quality || '360p';
      qualityMap[quality] = (qualityMap[quality] || 0) + 1;
    });

    const sorted = Object.entries(qualityMap).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '360p';
  }

  /**
   * Calculate average startup time
   */
  private calculateAverageStartupTime(events: AnalyticsEvent[]): number {
    const starts = events.filter((e) => e.eventType === AnalyticsEventType.STREAM_START);
    if (starts.length === 0) return 0;

    const times = starts
      .map((e) => e.eventData?.startupTime || 0)
      .filter((t) => t > 0);

    if (times.length === 0) return 0;
    return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100;
  }

  /**
   * Calculate completion rate
   */
  private calculateCompletionRate(starts: AnalyticsEvent[], ends: AnalyticsEvent[]): number {
    if (starts.length === 0) return 0;
    return Math.round((ends.length / starts.length) * 10000) / 100;
  }
}
