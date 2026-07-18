import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../config/rabbitmq.service';
import { EncodingService } from './encoding.service';
import { EncodingStatus, VideoStatus } from '../../types/content.types';
import { ConsumeMessage } from 'amqplib';
import { ContentService } from '../content/content.service';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Encoding Consumer
 * Consumes encoding jobs from RabbitMQ and processes them
 * In production, this would trigger FFmpeg encoding
 */
@Injectable()
export class EncodingConsumer implements OnModuleInit {
  private readonly logger = new Logger(EncodingConsumer.name);
  private readonly ENCODING_QUEUE = 'video-encoding';

  constructor(
    private rabbitMQService: RabbitMQService,
    private encodingService: EncodingService,
    private contentService: ContentService,
  ) {}

  async onModuleInit() {
    // Delay consumer initialization to ensure RabbitMQ is connected
    setTimeout(() => {
      this.consumeEncodingJobs();
    }, 5000); // Wait 5 seconds
  }

  /**
   * Consume encoding jobs from queue with retry logic
   */
  private async consumeEncodingJobs() {
    try {
      await this.rabbitMQService.consume(
      this.ENCODING_QUEUE,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const job = JSON.parse(msg.content.toString());
          this.logger.log(`Processing encoding job for video: ${job.videoId}`);
          await this.contentService.updateStatus(job.videoId, VideoStatus.PROCESSING);

          // Process each quality
          for (const quality of job.qualities) {
            const settings = this.encodingService.getQualitySettings(quality);

            // Create encoding record
            const encoding = await this.encodingService.createEncoding(
              job.videoId,
              quality as any,
              settings.bitrate,
              settings.resolution,
            );

            // Update status to encoding
            await this.encodingService.updateStatus(encoding._id.toString(), EncodingStatus.ENCODING);

            try {
              const output = await this.transcodeToHls(job.originalUrl, job.videoId, quality, settings);

              await this.encodingService.updateStatus(encoding._id.toString(), EncodingStatus.COMPLETED, {
                fileSize: output.fileSize,
                duration: output.duration,
                hlsUrl: output.playlistUrl,
              });
              this.logger.log(`Encoding completed: ${job.videoId} - ${quality}`);
            } catch (error) {
              await this.encodingService.updateStatus(encoding._id.toString(), EncodingStatus.FAILED);
              await this.contentService.updateStatus(job.videoId, VideoStatus.FAILED);
              throw error;
            }
          }

          this.rabbitMQService.ackMessage(msg);
        } catch (error) {
          this.logger.error(`Error processing encoding job:`, error);
          this.rabbitMQService.nackMessage(msg, false);
        }
      },
    );

    this.logger.log(`Encoding consumer started, listening on queue: ${this.ENCODING_QUEUE}`);
    } catch (error) {
      this.logger.error(`Failed to start encoding consumer: ${error instanceof Error ? error.message : String(error)}`);
      // Retry after 5 seconds
      setTimeout(() => {
        this.consumeEncodingJobs();
      }, 5000);
    }
  }

  private async transcodeToHls(
    originalUrl: string,
    videoId: string,
    quality: string,
    settings: { bitrate: number; resolution: string },
  ): Promise<{ playlistUrl: string; fileSize: number; duration?: number }> {
    const inputPath = this.resolveUploadPath(originalUrl);
    const outputDir = path.join(process.cwd(), 'uploads', 'hls', videoId, quality);
    const playlistPath = path.join(outputDir, 'playlist.m3u8');
    const segmentPattern = path.join(outputDir, 'segment_%03d.ts');
    const [width, height] = settings.resolution.split('x').map(Number);

    await fs.mkdir(outputDir, { recursive: true });
    await this.removeExistingHlsFiles(outputDir);

    await this.runFfmpeg([
      '-y',
      '-i',
      inputPath,
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v',
      'libx264',
      '-preset',
      process.env.FFMPEG_PRESET || 'veryfast',
      '-profile:v',
      'main',
      '-crf',
      process.env.FFMPEG_CRF || '23',
      '-b:v',
      `${settings.bitrate}k`,
      '-maxrate',
      `${Math.round(settings.bitrate * 1.07)}k`,
      '-bufsize',
      `${settings.bitrate * 2}k`,
      '-c:a',
      'aac',
      '-ar',
      '48000',
      '-b:a',
      quality === '240p' ? '64k' : '128k',
      '-hls_time',
      '6',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      segmentPattern,
      playlistPath,
    ]);

    const fileSize = await this.getDirectorySize(outputDir);

    return {
      playlistUrl: `/uploads/hls/${videoId}/${quality}/playlist.m3u8`,
      fileSize,
      duration: await this.probeDuration(inputPath),
    };
  }

  private resolveUploadPath(originalUrl: string): string {
    const normalizedUrl = originalUrl.split('?')[0];

    if (normalizedUrl.startsWith('/uploads/')) {
      return path.join(process.cwd(), normalizedUrl.replace(/^\//, ''));
    }

    if (path.isAbsolute(normalizedUrl)) {
      return normalizedUrl;
    }

    throw new Error(`Encoding input must be an uploaded file URL, received: ${originalUrl}`);
  }

  private async removeExistingHlsFiles(outputDir: string): Promise<void> {
    const entries = await fs.readdir(outputDir).catch((): string[] => []);
    await Promise.all(
      entries
        .filter((entry) => entry.endsWith('.m3u8') || entry.endsWith('.ts'))
        .map((entry) => fs.unlink(path.join(outputDir, entry))),
    );
  }

  private runFfmpeg(args: string[]): Promise<void> {
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    return new Promise((resolve, reject) => {
      const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`Unable to start FFmpeg (${ffmpegPath}): ${error.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
      });
    });
  }

  private async probeDuration(inputPath: string): Promise<number | undefined> {
    const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

    return new Promise((resolve) => {
      const child = spawn(ffprobePath, [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        inputPath,
      ]);

      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.on('error', () => resolve(undefined));
      child.on('close', (code) => {
        if (code !== 0) {
          resolve(undefined);
          return;
        }

        const duration = Number.parseFloat(stdout.trim());
        resolve(Number.isFinite(duration) ? Math.round(duration) : undefined);
      });
    });
  }

  private async getDirectorySize(dir: string): Promise<number> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return this.getDirectorySize(fullPath);
        }

        const stat = await fs.stat(fullPath);
        return stat.size;
      }),
    );

    return sizes.reduce((total, size) => total + size, 0);
  }
}
