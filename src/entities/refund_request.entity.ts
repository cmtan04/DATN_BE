import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RefundStatus } from '@/assets/enum/payment.enum';

@Entity('tb_refund_request')
@Index('IDX_tb_refund_request_booking', ['bookingId'])
@Index('IDX_tb_refund_request_user', ['userId'])
export class TBRefundRequest extends BaseEntity {
  @Column({ type: 'int', nullable: false, comment: 'ID nguoi dung' })
  userId: number;

  @Column({ type: 'int', nullable: false, comment: 'ID booking' })
  bookingId: number;

  @Column({ type: 'int', nullable: false, comment: 'ID payment' })
  paymentId: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'Tong so tien đã thanh toán',
  })
  totalAmount: number;

  @Column({ type: 'int', nullable: false, comment: 'So tien hoàn lại' })
  refundAmount: number;

  @Column({ type: 'int', nullable: false, comment: 'Phi huy booking' })
  cancellationFee: number;

  @Column({ type: 'int', nullable: false, comment: 'Ty le hoan tien (%)' })
  refundPercentage: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Ten ngan hang',
  })
  bankName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'So tai khoan',
  })
  accountNumber: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Ten chu tai khoan',
  })
  accountHolder: string;

  @Column({ type: 'text', nullable: true, comment: 'Ly do huy' })
  reason?: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    default: RefundStatus.PENDING,
    comment: 'Trang thai hoan tien',
  })
  status: RefundStatus;
}
