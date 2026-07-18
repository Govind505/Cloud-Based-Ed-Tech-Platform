import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ChatRoom' })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  senderEmail: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  encryptedContent: string;

  @Prop({ type: String })
  attachmentUrl?: string;

  @Prop({ type: String })
  attachmentName?: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ roomId: 1, createdAt: 1 });
