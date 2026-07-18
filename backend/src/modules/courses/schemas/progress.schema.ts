import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'progress' })
export class Progress extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  completedLessons: Types.ObjectId[];

  @Prop({ default: 0 })
  progressPercent: number;

  @Prop({ default: false })
  completed: boolean;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
