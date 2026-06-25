import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_notification')
@Index('IDX_NOTIFICATION_USER_READ', ['userId', 'isRead'])
@Index('IDX_NOTIFICATION_USER_CREATED', ['userId', 'createdAt'])
export class TBNotification extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Notification title',
  })
  title: string;

  @Column({ type: 'text', nullable: false, comment: 'Notification message' })
  message: string;

  @Column({ type: 'int', nullable: false, comment: 'User ID' })
  userId: number;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
