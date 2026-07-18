import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatRoom } from './schemas/chat-room.schema';
import { ChatMessage } from './schemas/chat-message.schema';
import { encrypt, decrypt } from '../../utils/crypto.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private encryptionKey: string;

  constructor(
    @InjectModel(ChatRoom.name) private roomModel: Model<ChatRoom>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessage>,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('CHAT_ENCRYPTION_KEY') || 'cloudedtechchat1';
  }

  async getRooms(email: string): Promise<ChatRoom[]> {
    return this.roomModel
      .find({
        $or: [{ participants: email }, { createdBy: email }],
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async createGroup(name: string, createdBy: string, participantEmails: string[] = []): Promise<ChatRoom> {
    const uniqueParticipants = Array.from(new Set([createdBy, ...participantEmails]));
    const room = new this.roomModel({
      name,
      isGroup: true,
      participants: uniqueParticipants,
      createdBy,
    });
    return room.save();
  }

  async saveMessage(
    roomId: string,
    senderEmail: string,
    senderName: string,
    content: string,
    attachmentUrl?: string,
    attachmentName?: string,
  ): Promise<ChatMessage> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (!room.participants.includes(senderEmail) && room.createdBy !== senderEmail) {
      throw new ForbiddenException('Not a participant in this room');
    }

    const encryptedContent = encrypt(content || '', this.encryptionKey);

    const message = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderEmail,
      senderName,
      encryptedContent,
      attachmentUrl,
      attachmentName,
    });

    await message.save();
    
    room.set('updatedAt', new Date());
    await room.save();

    return message;
  }

  async getMessages(roomId: string, userEmail: string): Promise<any[]> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (!room.participants.includes(userEmail) && room.createdBy !== userEmail) {
      throw new ForbiddenException('Not a participant in this room');
    }

    const messages = await this.messageModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .exec();

    return messages.map((msg) => {
      const decryptedText = decrypt(msg.encryptedContent, this.encryptionKey);
      return {
        _id: msg._id,
        roomId: msg.roomId,
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        content: decryptedText,
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
        createdAt: (msg as any).createdAt,
      };
    });
  }
}
