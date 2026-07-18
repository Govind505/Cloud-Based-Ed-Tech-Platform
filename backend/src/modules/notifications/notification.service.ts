import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationType } from './schemas/notification.schema';
import { CreateNotificationDto, NotificationResponseDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  /**
   * Admin: Create a new notification (global or direct)
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = new this.notificationModel(createNotificationDto);
    const saved = await notification.save();
    return this.toResponseDto(saved, '');
  }

  /**
   * User: Get notifications for the user
   */
  async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
    // Find all GLOBAL notifications OR DIRECT notifications targeting this user
    const notifications = await this.notificationModel
      .find({
        $or: [
          { type: NotificationType.GLOBAL },
          { type: NotificationType.DIRECT, targetUserId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50

    return notifications.map(notif => this.toResponseDto(notif, userId));
  }

  /**
   * User: Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Add userId to readBy array if not already present
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }
  }

  private toResponseDto(notification: Notification, currentUserId: string): NotificationResponseDto {
    return {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetUserId: notification.targetUserId,
      isRead: notification.readBy.includes(currentUserId),
      createdAt: (notification as any).createdAt,
    };
  }
}
