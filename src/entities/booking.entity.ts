import { BookingStatus } from '@assets/enum/payment.enum';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_booking')
@Index('IDX_tb_booking_location_dates_status', [
  'locationId',
  'startDate',
  'endDate',
  'status',
])
export class TBBooking extends BaseEntity {
  @Column({ type: 'int', nullable: false, comment: 'ID nguoi dat phong' })
  userId: number;

  @Column({ type: 'int', nullable: false, comment: 'ID dia diem' })
  locationId: number;

  @Column({ type: 'date', nullable: false, comment: 'Ngay bat dau dat phong' })
  startDate: string;

  @Column({ type: 'date', nullable: false, comment: 'Ngay ket thuc dat phong' })
  endDate: string;

  @Column({ type: 'int', nullable: false, comment: 'So luong khach' })
  guestCount: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  contactName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  contactEmail: string;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    default: BookingStatus.PENDING_PAYMENT,
  })
  status: BookingStatus;

  @Column({ type: 'int', nullable: false, comment: 'Tong tien VND' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'vnd' })
  currency: string;
}
