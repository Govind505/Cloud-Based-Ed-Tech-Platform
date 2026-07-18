import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || client.handshake.auth.token;
      if (!authHeader) {
        client.disconnect();
        return;
      }

      const token = authHeader.split(' ')[1] || authHeader;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      this.logger.log(`Client connected: ${payload.email}`);
    } catch (err) {
      this.logger.warn(`Connection authentication failed: ${(err as any).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    this.logger.log(`User ${client.data.user?.email} joined room ${roomId}`);
    client.to(roomId).emit('userJoined', { email: client.data.user?.email });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string; attachmentUrl?: string; attachmentName?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const message = await this.chatService.saveMessage(
      payload.roomId,
      user.email,
      user.email.split('@')[0],
      payload.content,
      payload.attachmentUrl,
      payload.attachmentName,
    );

    const decryptedMsg = {
      _id: message._id,
      roomId: message.roomId,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      content: payload.content,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      createdAt: (message as any).createdAt,
    };

    this.server.to(payload.roomId).emit('newMessage', decryptedMsg);
  }
}
