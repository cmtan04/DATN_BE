import { PaymentMethod, PaymentStatus } from '@assets/enum/payment.enum';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_payment')
@Index('IDX_tb_payment_booking', ['bookingId'])
@Index('IDX_tb_payment_payos_order', ['payosOrderCode'], { unique: true })
export class TBPayment extends BaseEntity {
  @Column({ type: 'int', nullable: false, comment: 'ID nguoi thanh toan' })
  userId: number;

  @Column({ type: 'int', nullable: false, comment: 'ID booking' })
  bookingId: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: PaymentMethod.PAYOS,
  })
  method: PaymentMethod;

  @Column({ type: 'int', nullable: false, comment: 'So tien VND' })
  amount: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'vnd' })
  currency: string;

  @Column({
    type: 'int',
    nullable: false,
    default: PaymentStatus.UNPAID,
  })
  status: PaymentStatus;

  @Column({ type: 'int', nullable: true })
  payosOrderCode?: number;

  @Column({ type: 'text', nullable: true })
  qrCode?: string;
}
