import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'courses' })
export class Course extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String })
  thumbnail?: string;

  @Prop({ required: true, type: String, ref: 'User' })
  instructor: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module' }], default: [] })
  modules: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  enrolledStudents: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
