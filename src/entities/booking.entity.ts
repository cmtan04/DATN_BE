import { BookingStatus } from '@assets/enum/payment.enum';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tb_booking')
export class TBBooking extends BaseEntity {
  @Column({ type: 'int', nullable: false, comment: 'ID nguoi dat phong' })
  userId: number;

  @Column({ type: 'int', nullable: false, comment: 'ID dia diem' })
  locationId: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Ma dat phong',
    unique: true,
  })
  bookingCode: string;

  @Column({ type: 'date', nullable: false, comment: 'Ngay bat dau dat phong' })
  startDate: Date;

  @Column({ type: 'date', nullable: false, comment: 'Ngay ket thuc dat phong' })
  endDate: Date;

  @Column({ type: 'int', nullable: false, comment: 'So phong da dat' })
  roomNumber: number;

  @Column({ type: 'int', nullable: false, default: 1, comment: 'So luong khach' })
  guestCount: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    default: BookingStatus.CREATED,
  })
  status: BookingStatus;

  @Column({ type: 'int', nullable: false, comment: 'Tong tien VND' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'vnd' })
  currency: string;
}
