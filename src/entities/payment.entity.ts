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
    type: 'varchar',
    length: 32,
    nullable: false,
    default: PaymentStatus.UNPAID,
  })
  status: PaymentStatus;

  @Column({ type: 'int', nullable: true })
  payosOrderCode?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payosPaymentLinkId?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  checkoutUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  qrCode?: string | null;
}
