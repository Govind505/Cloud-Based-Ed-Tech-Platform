import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { VideoStatus } from '../../../types/content.types';

/**
 * Video Schema
 * MongoDB document for video content
 */
@Schema({
  timestamps: true,
  collection: 'videos',
})
export class Video extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ required: true })
  courseId: string;

  @Prop({ required: true, type: String, ref: 'User' })
  uploadedBy: string;

  @Prop({ required: true })
  duration: number; // in seconds

  @Prop({ type: String, nullable: true })
  thumbnail?: string;

  @Prop({ enum: Object.values(VideoStatus), default: VideoStatus.DRAFT })
  status: VideoStatus;

  @Prop({ required: true })
  originalUrl: string;

  @Prop({ required: true })
  fileSize: number; // in bytes

  @Prop({ type: String, nullable: true })
  resolution?: string; // e.g., "1920x1080"

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const VideoSchema = SchemaFactory.createForClass(Video);

// Create indexes
VideoSchema.index({ uploadedBy: 1 });
VideoSchema.index({ courseId: 1 });
VideoSchema.index({ status: 1 });
VideoSchema.index({ createdAt: -1 });
VideoSchema.index({ title: 'text', description: 'text' }); // Text search
