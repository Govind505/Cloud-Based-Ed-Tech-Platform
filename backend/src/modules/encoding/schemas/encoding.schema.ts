import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EncodingStatus } from '../../../types/content.types';

/**
 * Encoding Schema
 * Tracks video encoding jobs and results
 */
@Schema({
  timestamps: true,
  collection: 'encodings',
})
export class Encoding extends Document {
  @Prop({ required: true, type: String, ref: 'Video' })
  videoId: string;

  @Prop({ required: true, enum: ['240p', '360p', '480p', '720p'] })
  quality: string;

  @Prop({ required: true })
  bitrate: number; // in kbps

  @Prop({ required: true })
  resolution: string; // e.g., "426x240"

  @Prop({ required: true })
  hlsUrl: string;

  @Prop({ enum: Object.values(EncodingStatus), default: EncodingStatus.PENDING })
  status: EncodingStatus;

  @Prop({ type: Number, nullable: true })
  fileSize?: number; // in bytes

  @Prop({ type: Number, nullable: true })
  duration?: number; // in seconds

  @Prop({ type: Date, nullable: true })
  startedAt?: Date;

  @Prop({ type: Date, nullable: true })
  completedAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EncodingSchema = SchemaFactory.createForClass(Encoding);

// Create indexes
EncodingSchema.index({ videoId: 1 });
EncodingSchema.index({ status: 1 });
EncodingSchema.index({ videoId: 1, quality: 1 }, { unique: true });
