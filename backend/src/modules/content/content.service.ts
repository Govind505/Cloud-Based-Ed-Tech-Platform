import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Video } from './schemas/video.schema';
import { CreateVideoDto, UpdateVideoDto, VideoResponseDto, VideoListQueryDto } from './dto/content.dto';
import { VideoStatus } from '../../types/content.types';
import { RabbitMQService } from '../../config/rabbitmq.service';

import { S3Service } from '../../common/services/s3.service';

/**
 * Content Service
 * Handles video content CRUD operations and upload processing
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly ENCODING_QUEUE = 'video-encoding';
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'videos');

  constructor(
    @InjectModel(Video.name) private videoModel: Model<Video>,
    private rabbitMQService: RabbitMQService,
    private s3Service: S3Service,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Handle Direct Video Upload
   */
  async upload(
    userId: string,
    file: any,
    metadata: { title: string; description?: string; courseId: string },
  ): Promise<VideoResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No video file uploaded');
      }

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      let videoUrl: string;

      try {
        // Try S3 first
        this.logger.log(`Attempting S3 upload for: ${fileName}`);
        videoUrl = await this.s3Service.uploadFile(
          file.buffer,
          fileName,
          file.mimetype,
        );
        this.logger.log(`S3 upload successful: ${videoUrl}`);
      } catch (error: any) {
        this.logger.warn(`S3 upload failed, falling back to local storage: ${error.message}`);
        
        // Fallback to local
        const filePath = path.join(this.UPLOAD_DIR, fileName);
        try {
          fs.writeFileSync(filePath, file.buffer);
          videoUrl = `/uploads/videos/${fileName}`;
          this.logger.log(`Local upload successful: ${videoUrl}`);
        } catch (localError: any) {
          this.logger.error(`Local filesystem write failed: ${localError.message}`);
          throw new BadRequestException('Failed to save file locally');
        }
      }

      const video = new this.videoModel({
        title: metadata.title,
        description: metadata.description,
        courseId: metadata.courseId,
        uploadedBy: userId,
        status: VideoStatus.PROCESSING,
        originalUrl: videoUrl,
        fileSize: file.size,
        duration: 0, 
      });

      const savedVideo = await video.save();
      this.logger.log(`Video record saved: ${savedVideo._id}`);
      
      // In production, encoding would also use S3 URLs
      await this.publishEncodingJob(savedVideo._id.toString(), videoUrl);

      return this.toResponseDto(savedVideo);
    } catch (uploadError: any) {
      this.logger.error(`Critical Upload Failure: ${uploadError.message}`);
      throw uploadError;
    }
  }

  /**
   * Create a new video record
   */
  async create(userId: string, createVideoDto: CreateVideoDto): Promise<VideoResponseDto> {
    this.logger.debug(`Creating video: ${createVideoDto.title} by user: ${userId}`);

    const video = new this.videoModel({
      ...createVideoDto,
      uploadedBy: userId,
      status: VideoStatus.UPLOADING,
    });

    const savedVideo = await video.save();

    // Publish encoding job to queue
    await this.publishEncodingJob(savedVideo._id.toString(), createVideoDto.originalUrl);

    this.logger.log(`Video created: ${savedVideo._id} - ${createVideoDto.title}`);
    return this.toResponseDto(savedVideo);
  }

  async findById(id: string): Promise<VideoResponseDto> {
    let video;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      video = await this.videoModel.findById(id);
    } else {
      video = await this.videoModel.findOne({ courseId: id });
    }
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return this.toResponseDto(video);
  }

  /**
   * Update video (owner only)
   */
  async update(
    id: string,
    userId: string,
    updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    const video = await this.videoModel.findById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check ownership
    if (video.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own videos');
    }

    const updatedVideo = await this.videoModel.findByIdAndUpdate(id, updateVideoDto, {
      new: true,
      runValidators: true,
    });

    this.logger.log(`Video updated: ${id}`);
    return this.toResponseDto(updatedVideo);
  }

  /**
   * Delete video (owner only)
   */
  async delete(id: string, userId: string): Promise<{ message: string }> {
    const video = await this.videoModel.findById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check ownership
    if (video.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own videos');
    }

    await this.videoModel.findByIdAndDelete(id);
    this.logger.log(`Video deleted: ${id}`);
    return { message: 'Video deleted successfully' };
  }

  /**
   * List videos with filters and pagination
   */
  async findAll(query: VideoListQueryDto): Promise<VideoResponseDto[]> {
    const { skip = 0, limit = 10, courseId, userId, status, search } = query;

    const filter: any = {};

    if (courseId) filter.courseId = courseId;
    if (userId) filter.uploadedBy = userId;
    if (status) filter.status = status;

    if (search) {
      filter.$text = { $search: search };
    }

    const videos = await this.videoModel
      .find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return videos.map((video) => this.toResponseDto(video));
  }

  /**
   * Get trending videos
   */
  async getTrending(limit = 10): Promise<VideoResponseDto[]> {
    // Simple implementation: most recent ready videos
    // In production, this would use analytics data
    const videos = await this.videoModel
      .find({ status: VideoStatus.READY })
      .sort({ createdAt: -1 })
      .limit(limit);

    return videos.map((video) => this.toResponseDto(video));
  }

  /**
   * Get user's videos
   */
  async getUserVideos(userId: string, skip = 0, limit = 10): Promise<VideoResponseDto[]> {
    const videos = await this.videoModel
      .find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return videos.map((video) => this.toResponseDto(video));
  }

  /**
   * Update video status (used by encoding service)
   */
  async updateStatus(id: string, status: VideoStatus): Promise<void> {
    await this.videoModel.findByIdAndUpdate(id, { status });
    this.logger.debug(`Video status updated: ${id} -> ${status}`);
  }

  /**
   * Publish encoding job to RabbitMQ
   */
  private async publishEncodingJob(videoId: string, originalUrl: string): Promise<void> {
    try {
      const job = {
        videoId,
        originalUrl,
        qualities: ['240p', '360p', '480p', '720p'],
        timestamp: new Date().toISOString(),
      };

      await this.rabbitMQService.publishToQueue(this.ENCODING_QUEUE, job);
      this.logger.log(`Encoding job published for video: ${videoId}`);
    } catch (error: any) {
      this.logger.warn(`RabbitMQ not available. Skipping encoding queue for ${videoId}.`);
      this.logger.debug(`Reason: ${error.message}`);
      
      // For development: mark as READY immediately if queue fails
      await this.updateStatus(videoId, VideoStatus.READY);
      this.logger.log(`Video ${videoId} marked as READY (Development Fallback)`);
    }
  }

  /**
   * Convert Mongoose document to response DTO
   */
  private toResponseDto(video: Video): VideoResponseDto {
    return {
      id: video._id.toString(),
      title: video.title,
      description: video.description,
      courseId: video.courseId,
      uploadedBy: video.uploadedBy.toString(),
      duration: video.duration,
      thumbnail: video.thumbnail,
      status: video.status,
      originalUrl: video.originalUrl,
      fileSize: video.fileSize,
      resolution: video.resolution,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }
}
