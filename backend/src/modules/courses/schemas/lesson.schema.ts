import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'lessons' })
export class Lesson extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Module' })
  moduleId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, type: String, enum: ['video', 'text'], default: 'video' })
  type: string;

  @Prop({ type: String, ref: 'Video' })
  videoId?: string;

  @Prop({ type: String, trim: true })
  content?: string;

  @Prop({ default: 0 })
  duration: number; // in seconds
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
