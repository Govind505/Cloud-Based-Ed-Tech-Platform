import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { StartSessionDto, SessionEventDto, StreamingSessionResponseDto } from './dto/streaming.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Streaming Controller
 * Handles HLS streaming endpoints
 */
@ApiTags('Streaming')
@Controller('streaming')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StreamingController {
  constructor(private streamingService: StreamingService) {}

  /**
   * Get Master HLS Manifest
   */
  @Get(':videoId/manifest.m3u8')
  @ApiOperation({ summary: 'Get HLS master manifest' })
  @ApiParam({ name: 'videoId', description: 'Video ID' })
  @ApiResponse({ status: 200, description: 'HLS manifest' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async getMasterManifest(
    @Param('videoId') videoId: string,
    @Res() res: Response,
  ): Promise<void> {
    const manifest = await this.streamingService.getMasterManifest(videoId);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(manifest);
  }

  /**
   * Get Quality-Specific Playlist
   */
  @Get(':videoId/:quality/playlist.m3u8')
  @ApiOperation({ summary: 'Get quality-specific HLS playlist' })
  @ApiParam({ name: 'videoId', description: 'Video ID' })
  @ApiParam({ name: 'quality', description: 'Quality (240p, 360p, 480p, 720p)' })
  @ApiResponse({ status: 200, description: 'HLS playlist' })
  async getQualityPlaylist(
    @Param('videoId') videoId: string,
    @Param('quality') quality: string,
    @Res() res: Response,
  ): Promise<void> {
    const playlist = await this.streamingService.getQualityPlaylist(videoId, quality);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(playlist);
  }

  /**
   * Start Streaming Session
   */
  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a streaming session' })
  @ApiResponse({
    status: 201,
    description: 'Session started',
    type: StreamingSessionResponseDto,
  })
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() startSessionDto: StartSessionDto,
  ): Promise<StreamingSessionResponseDto> {
    return this.streamingService.startSession(userId, startSessionDto);
  }

  /**
   * Update Session (Heartbeat)
   */
  @Post('session/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update streaming session (heartbeat)' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  async updateSession(@Body() eventDto: SessionEventDto): Promise<{ message: string }> {
    await this.streamingService.updateSession(eventDto.sessionId, eventDto);
    return { message: 'Session updated' };
  }

  /**
   * End Streaming Session
   */
  @Post('session/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End streaming session' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  async endSession(@Body('sessionId') sessionId: string): Promise<{ message: string }> {
    return this.streamingService.endSession(sessionId);
  }

  /**
   * Get Recommended Quality
   */
  @Get('quality/recommend')
  @ApiOperation({ summary: 'Get recommended quality based on bandwidth' })
  @ApiResponse({ status: 200, description: 'Recommended quality' })
  async getRecommendedQuality(
    @Query('bandwidth') bandwidth: string,
  ): Promise<{ quality: string }> {
    const bandwidthKbps = parseInt(bandwidth) || 1000;
    const quality = this.streamingService.getRecommendedQuality(bandwidthKbps);
    return { quality };
  }
}
