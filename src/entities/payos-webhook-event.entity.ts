import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_payos_webhook_event')
@Index('IDX_tb_payos_webhook_event_key', ['payosEventKey'], { unique: true })
export class TBPayosWebhookEvent extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  payosEventKey: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  type: string;

  @Column({ type: 'timestamp', nullable: false })
  processedAt: Date;
}
