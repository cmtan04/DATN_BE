import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationResponseDto } from '@/dtos/notification.dto';
import {
  CreateNotificationData,
  NotificationRepository,
} from '@/repositories/notification.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async createMany(
    items: CreateNotificationData[],
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.createMany(items);

    notifications.forEach((notification) => {
      this.eventEmitter.emit(`notification.${notification.userId}`, notification);
    });

    return notifications;
  }

  public async getCurrentUserNotifications(
    userId: number,
  ): Promise<NotificationResponseDto[]> {
    return await this.notificationRepository.findByUserId(userId);
  }

  public async markCurrentUserNotificationRead(
    userId: number,
    notificationId: number,
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot update this notification');
    }

    if (!notification.isRead) {
      await this.notificationRepository.markRead(notificationId);
      notification.isRead = true;
    }

    return this.notificationRepository.mapResponse(notification);
  }
}
