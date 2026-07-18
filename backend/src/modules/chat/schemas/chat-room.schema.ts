import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'chat_rooms' })
export class ChatRoom extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  participants: string[];

  @Prop({ required: true })
  createdBy: string;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
