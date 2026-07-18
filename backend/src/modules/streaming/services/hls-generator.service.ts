import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentService } from '../../content/content.service';
import { EncodingService } from '../../encoding/encoding.service';
import { EncodingStatus, VideoStatus } from '../../../types/content.types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * HLS Generator Service
 * Generates HLS manifest files for adaptive streaming
 */
@Injectable()
export class HlsGeneratorService {
  private readonly logger = new Logger(HlsGeneratorService.name);

  constructor(
    private contentService: ContentService,
    private encodingService: EncodingService,
  ) {}

  /**
   * Generate master playlist (manifest.m3u8)
   */
  async generateMasterPlaylist(videoId: string): Promise<string> {
    const video = await this.contentService.findById(videoId);
    if (video.status !== VideoStatus.READY) {
      throw new NotFoundException('Video is not ready for streaming');
    }

    // Get all available encodings
    const encodings = await this.encodingService.findByVideoId(videoId);

    if (encodings.length === 0) {
      throw new NotFoundException('No encodings available for this video');
    }

    // Build master playlist
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';

    // Add quality variants
    let completedVariantCount = 0;
    for (const encoding of encodings) {
      if (encoding.status === EncodingStatus.COMPLETED) {
        const bandwidth = this.getBandwidthForQuality(encoding.quality);
        const playlistUrl = encoding.hlsUrl || `/uploads/hls/${videoId}/${encoding.quality}/playlist.m3u8`;
        playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${encoding.resolution}\n`;
        playlist += `${playlistUrl}\n`;
        completedVariantCount++;
      }
    }

    if (completedVariantCount === 0) {
      throw new NotFoundException('No completed encodings available for this video');
    }

    this.logger.debug(`Master playlist generated for video: ${videoId}`);
    return playlist;
  }

  /**
   * Generate quality-specific playlist
   */
  async generateQualityPlaylist(videoId: string, quality: string): Promise<string> {
    const encoding = await this.encodingService.findByVideoIdAndQuality(videoId, quality);

    if (!encoding || encoding.status !== EncodingStatus.COMPLETED) {
      throw new NotFoundException(`Encoding not found or not ready for quality: ${quality}`);
    }

    const playlistPath = path.join(
      process.cwd(),
      encoding.hlsUrl.replace(/^\/uploads\//, 'uploads/'),
    );
    const playlist = await fs.readFile(playlistPath, 'utf8').catch(() => {
      throw new NotFoundException(`Playlist file not found for quality: ${quality}`);
    });

    this.logger.debug(`Quality playlist generated: ${videoId}/${quality}`);
    return playlist;
  }

  /**
   * Get bandwidth estimate for quality
   */
  private getBandwidthForQuality(quality: string): number {
    const bandwidthMap: Record<string, number> = {
      '240p': 400000, // 400 kbps
      '360p': 800000, // 800 kbps
      '480p': 1200000, // 1.2 Mbps
      '720p': 2500000, // 2.5 Mbps
    };
    return bandwidthMap[quality] || 400000;
  }
}
