import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationResponseDto } from '@/dtos/notification.dto';
import { TBNotification } from '@/entities/notifications.entity';

export interface CreateNotificationData {
  userId: number;
  title: string;
  message: string;
}

@Injectable()
export class NotificationRepository {
  @InjectRepository(TBNotification)
  private readonly notification: Repository<TBNotification>;

  public async createMany(
    items: CreateNotificationData[],
  ): Promise<NotificationResponseDto[]> {
    if (!items.length) {
      return [];
    }

    const notifications = await this.notification.save(
      items.map((item) => this.notification.create(item)),
    );

    return notifications.map((notification) => this.mapResponse(notification));
  }

  public async findByUserId(
    userId: number,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notification.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => this.mapResponse(notification));
  }

  public async findById(id: number): Promise<TBNotification | null> {
    return await this.notification.findOne({ where: { id } });
  }

  public async markRead(id: number): Promise<void> {
    await this.notification.update(id, { isRead: true });
  }

  public mapResponse(
    notification: TBNotification,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
