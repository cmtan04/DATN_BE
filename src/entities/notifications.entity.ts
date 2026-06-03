import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_notification')
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
