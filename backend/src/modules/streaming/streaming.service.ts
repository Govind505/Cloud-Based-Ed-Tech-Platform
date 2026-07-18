import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StreamingSession } from './schemas/streaming-session.schema';
import { StartSessionDto, SessionEventDto, StreamingSessionResponseDto } from './dto/streaming.dto';
import { HlsGeneratorService } from './services/hls-generator.service';
import { QualitySelectorService } from './services/quality-selector.service';

/**
 * Streaming Service
 * Handles HLS streaming, session tracking, and adaptive bitrate
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);

  constructor(
    @InjectModel(StreamingSession.name) private sessionModel: Model<StreamingSession>,
    private hlsGenerator: HlsGeneratorService,
    private qualitySelector: QualitySelectorService,
  ) {}

  /**
   * Get master HLS manifest
   */
  async getMasterManifest(videoId: string): Promise<string> {
    return this.hlsGenerator.generateMasterPlaylist(videoId);
  }

  /**
   * Get quality-specific playlist
   */
  async getQualityPlaylist(videoId: string, quality: string): Promise<string> {
    return this.hlsGenerator.generateQualityPlaylist(videoId, quality);
  }

  /**
   * Start streaming session
   */
  async startSession(
    userId: string,
    startSessionDto: StartSessionDto,
  ): Promise<StreamingSessionResponseDto> {
    this.logger.debug(`Starting streaming session: user=${userId}, video=${startSessionDto.videoId}`);

    const session = new this.sessionModel({
      userId,
      videoId: startSessionDto.videoId,
      quality: startSessionDto.quality,
      startedAt: new Date(),
    });

    const savedSession = await session.save();
    return this.toResponseDto(savedSession);
  }

  /**
   * Update session heartbeat
   */
  async updateSession(sessionId: string, eventDto: SessionEventDto): Promise<void> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Streaming session not found');
    }

    const updates: any = {};

    if (eventDto.quality && eventDto.quality !== session.quality) {
      updates.quality = eventDto.quality;
      updates.qualitySwitches = (session.qualitySwitches || 0) + 1;
    }

    await this.sessionModel.findByIdAndUpdate(sessionId, updates);
    this.logger.debug(`Session updated: ${sessionId}`);
  }

  /**
   * End streaming session
   */
  async endSession(sessionId: string): Promise<{ message: string }> {
    const session = await this.sessionModel.findByIdAndUpdate(
      sessionId,
      { endedAt: new Date() },
      { new: true },
    );

    if (!session) {
      throw new NotFoundException('Streaming session not found');
    }

    this.logger.log(`Streaming session ended: ${sessionId}`);
    return { message: 'Session ended successfully' };
  }

  /**
   * Get recommended quality based on bandwidth
   */
  getRecommendedQuality(bandwidthKbps: number): '240p' | '360p' | '480p' | '720p' {
    return this.qualitySelector.selectQuality(bandwidthKbps);
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(session: StreamingSession): StreamingSessionResponseDto {
    return {
      id: session._id.toString(),
      userId: session.userId.toString(),
      videoId: session.videoId.toString(),
      quality: session.quality,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }
}
