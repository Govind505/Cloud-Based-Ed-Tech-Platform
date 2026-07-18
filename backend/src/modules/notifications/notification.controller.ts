import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationResponseDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/user.types';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles(UserRole.ADMIN) // Only Admin can send notifications
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<NotificationResponseDto[]> {
    return this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationService.markAsRead(id, userId);
    return { success: true };
  }
}
