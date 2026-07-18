import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  GLOBAL = 'GLOBAL',
  DIRECT = 'DIRECT',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ enum: Object.values(NotificationType), default: NotificationType.GLOBAL })
  type: NotificationType;

  // Optional: only used if type === DIRECT
  @Prop({ type: String, ref: 'User', nullable: true })
  targetUserId?: string;

  // Array of user IDs who have read/dismissed the notification
  @Prop({ type: [String], default: [] })
  readBy: string[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
