import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'submissions' })
export class Submission extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Quiz' })
  quizId: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  answers: number[];

  @Prop({ required: true, type: Number })
  score: number; // percentage

  @Prop({ required: true, type: Boolean })
  passed: boolean;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
