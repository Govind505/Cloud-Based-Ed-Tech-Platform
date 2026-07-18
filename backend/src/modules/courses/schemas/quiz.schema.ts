import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Question {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, type: Number })
  correctAnswerIndex: number;
}

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lesson' })
  lessonId: Types.ObjectId;

  @Prop({ type: [Question], default: [] })
  questions: Question[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
