import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, VideoMetricsResponseDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Analytics Controller
 * Handles analytics event tracking
 */
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Get User Statistics
   */
  @Get('user/stats')
  @ApiOperation({ summary: 'Get user analytics statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved',
  })
  async getUserStats(@CurrentUser('id') userId: string): Promise<any> {
    return this.analyticsService.getUserStats(userId);
  }

  /**
   * Track Analytics Event
   */
  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(
    @CurrentUser('id') userId: string,
    @Body() trackEventDto: TrackEventDto,
  ): Promise<{ message: string }> {
    await this.analyticsService.trackEvent(userId, trackEventDto);
    return { message: 'Event tracked successfully' };
  }

  /**
   * Get Video Metrics
   */
  @Get('video/:videoId/metrics')
  @ApiOperation({ summary: 'Get video analytics metrics' })
  @ApiResponse({
    status: 200,
    description: 'Video metrics retrieved',
    type: VideoMetricsResponseDto,
  })
  async getVideoMetrics(@Param('videoId') videoId: string): Promise<VideoMetricsResponseDto> {
    return this.analyticsService.getVideoMetrics(videoId);
  }
}
