import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { AnalyticsEventType } from '../../../types/analytics.types';

export class TrackEventDto {
  @ApiProperty({ description: 'Video ID' })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({ enum: AnalyticsEventType, description: 'Event type' })
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @ApiPropertyOptional({ description: 'Event data' })
  @IsObject()
  @IsOptional()
  eventData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Bandwidth in kbps' })
  @IsOptional()
  bandwidth?: number;

  @ApiPropertyOptional({ description: 'Device type' })
  @IsString()
  @IsOptional()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Platform' })
  @IsString()
  @IsOptional()
  platform?: string;
}

export class VideoMetricsResponseDto {
  @ApiProperty()
  videoId: string;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalMinutesWatched: number;

  @ApiProperty()
  averageQuality: string;

  @ApiProperty()
  bufferingEventCount: number;

  @ApiProperty()
  averageStartupTime: number;

  @ApiProperty()
  completionRate: number;
}

export class RecentActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: 'completed' | 'started' | 'badge';

  @ApiProperty()
  title: string;

  @ApiProperty()
  timestamp: Date;
}

export class UserStatsResponseDto {
  @ApiProperty()
  totalWatchTimeMinutes: number;

  @ApiProperty()
  completedCourses: number;

  @ApiProperty()
  inProgressCourses: number;

  @ApiProperty()
  badgesEarned: number;

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivity: RecentActivityDto[];
}
