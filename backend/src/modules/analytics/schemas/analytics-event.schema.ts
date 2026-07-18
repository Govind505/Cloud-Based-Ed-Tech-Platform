import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AnalyticsEventType } from '../../../types/analytics.types';

/**
 * Analytics Event Schema
 * Tracks user events for analytics
 */
@Schema({
  timestamps: true,
  collection: 'analytics_events',
})
export class AnalyticsEvent extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: String, ref: 'Video' })
  videoId: string;

  @Prop({ required: true, enum: Object.values(AnalyticsEventType) })
  eventType: AnalyticsEventType;

  @Prop({ type: Object, default: {} })
  eventData: Record<string, any>;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Number, nullable: true })
  bandwidth?: number; // kbps

  @Prop({ type: String, nullable: true })
  deviceType?: string; // mobile, tablet, desktop

  @Prop({ type: String, nullable: true })
  platform?: string; // iOS, Android, Web

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// Create indexes
AnalyticsEventSchema.index({ userId: 1 });
AnalyticsEventSchema.index({ videoId: 1 });
AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ eventType: 1 });
