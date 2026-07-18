import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Streaming Session Schema
 * Tracks user streaming sessions for analytics
 */
@Schema({
  timestamps: true,
  collection: 'streaming_sessions',
})
export class StreamingSession extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: String, ref: 'Video' })
  videoId: string;

  @Prop({ required: true, enum: ['240p', '360p', '480p', '720p'] })
  quality: string;

  @Prop({ required: true, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, nullable: true })
  endedAt?: Date;

  @Prop({ default: 0 })
  bufferingEvents: number;

  @Prop({ default: 0 })
  qualitySwitches: number;

  @Prop({ default: 0 })
  totalBytesTransferred: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const StreamingSessionSchema = SchemaFactory.createForClass(StreamingSession);

// Create indexes
StreamingSessionSchema.index({ userId: 1 });
StreamingSessionSchema.index({ videoId: 1 });
StreamingSessionSchema.index({ startedAt: -1 });
