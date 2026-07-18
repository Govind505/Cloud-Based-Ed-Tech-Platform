import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Encoding } from './schemas/encoding.schema';
import { EncodingStatus } from '../../types/content.types';
import { ContentService } from '../content/content.service';
import { VideoStatus } from '../../types/content.types';

/**
 * Encoding Service
 * Manages video encoding jobs and status
 */
@Injectable()
export class EncodingService {
  private readonly logger = new Logger(EncodingService.name);
  private readonly requiredQualities = ['240p', '360p', '480p', '720p'];

  constructor(
    @InjectModel(Encoding.name) private encodingModel: Model<Encoding>,
    private contentService: ContentService,
  ) {}

  /**
   * Create encoding job
   */
  async createEncoding(
    videoId: string,
    quality: '240p' | '360p' | '480p' | '720p',
    bitrate: number,
    resolution: string,
  ): Promise<Encoding> {
    return this.encodingModel.findOneAndUpdate(
      { videoId, quality },
      {
        videoId,
        quality,
        bitrate,
        resolution,
        hlsUrl: `/uploads/hls/${videoId}/${quality}/playlist.m3u8`,
        status: EncodingStatus.PENDING,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  /**
   * Update encoding status
   */
  async updateStatus(
    encodingId: string,
    status: EncodingStatus,
    updates?: Partial<Encoding>,
  ): Promise<Encoding> {
    const updateData: any = { status };

    if (status === EncodingStatus.ENCODING && !updates?.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === EncodingStatus.COMPLETED && !updates?.completedAt) {
      updateData.completedAt = new Date();
    }

    if (updates) {
      Object.assign(updateData, updates);
    }

    const encoding = await this.encodingModel.findByIdAndUpdate(encodingId, updateData, {
      new: true,
    });

    if (!encoding) {
      throw new NotFoundException('Encoding not found');
    }

    // Check if all encodings are complete
    if (status === EncodingStatus.COMPLETED) {
      await this.checkVideoReady(encoding.videoId.toString());
    }

    return encoding;
  }

  /**
   * Find encodings by video ID
   */
  async findByVideoId(videoId: string): Promise<Encoding[]> {
    return this.encodingModel.find({ videoId });
  }

  /**
   * Find encoding by video ID and quality
   */
  async findByVideoIdAndQuality(
    videoId: string,
    quality: string,
  ): Promise<Encoding | null> {
    return this.encodingModel.findOne({ videoId, quality });
  }

  /**
   * Get encoding by ID
   */
  async findById(id: string): Promise<Encoding> {
    const encoding = await this.encodingModel.findById(id);
    if (!encoding) {
      throw new NotFoundException('Encoding not found');
    }
    return encoding;
  }

  /**
   * Check if all encodings are complete and update video status
   */
  private async checkVideoReady(videoId: string): Promise<void> {
    const encodings = await this.findByVideoId(videoId);
    const completedQualities = new Set(
      encodings
        .filter((encoding) => encoding.status === EncodingStatus.COMPLETED)
        .map((encoding) => encoding.quality),
    );
    const allComplete = this.requiredQualities.every((quality) =>
      completedQualities.has(quality),
    );

    if (allComplete) {
      await this.contentService.updateStatus(videoId, VideoStatus.READY);
      this.logger.log(`Video ${videoId} is now ready for streaming`);
    }
  }

  /**
   * Get encoding quality settings
   */
  getQualitySettings(quality: string): { bitrate: number; resolution: string } {
    const settings: Record<string, { bitrate: number; resolution: string }> = {
      '240p': { bitrate: 400, resolution: '426x240' },
      '360p': { bitrate: 800, resolution: '640x360' },
      '480p': { bitrate: 1200, resolution: '854x480' },
      '720p': { bitrate: 2500, resolution: '1280x720' },
    };

    return settings[quality] || settings['240p'];
  }
}
