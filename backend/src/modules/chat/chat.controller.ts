import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ITokenPayload } from '../../types/user.types';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const uploadDir = join(process.cwd(), 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('chat')
@UseGuards(RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getRooms(@CurrentUser() user: ITokenPayload) {
    return this.chatService.getRooms(user.email);
  }

  @Post('rooms')
  async createGroup(
    @CurrentUser() user: ITokenPayload,
    @Body('name') name: string,
    @Body('participants') participants: string[],
  ) {
    if (!name) {
      throw new BadRequestException('Room name is required');
    }
    return this.chatService.createGroup(name, user.email, participants || []);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: ITokenPayload,
  ) {
    return this.chatService.getMessages(roomId, user.email);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const relativeUrl = `/uploads/chat/${file.filename}`;
    return {
      url: relativeUrl,
      name: file.originalname,
    };
  }
}
