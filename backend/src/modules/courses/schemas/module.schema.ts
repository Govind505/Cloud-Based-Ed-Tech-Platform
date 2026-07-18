import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'modules' })
export class Module extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }], default: [] })
  lessons: Types.ObjectId[];
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
