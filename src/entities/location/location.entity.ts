import { BaseEntity } from '../base.entity';
import { Column, Entity } from 'typeorm';

@Entity('tb_location')
export class TBLocation extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Ten dia diem',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Mo ta dia diem',
  })
  description?: string | null;

  @Column({ type: 'int', nullable: false, comment: 'ID nguoi so huu' })
  ownerId: number;

  @Column({ type: 'int', nullable: false, comment: 'Gia' })
  price: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Don vi tinh',
  })
  priceUnit: string;

  @Column({ type: 'int', nullable: false, comment: 'Dien tich' })
  area: number;

  @Column({ type: 'int', nullable: false, comment: 'So luong khach' })
  maxGuestCount: number;

  @Column({ type: 'int', nullable: true, comment: 'Primary key' })
  locationAddressId?: number;

  @Column({ type: 'int', nullable: true, comment: 'Primary key' })
  locationTypeId?: number;

  @Column({ type: 'int', nullable: false, comment: 'So luong phong' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: false,
    default: 0,
    comment: 'Diem danh gia trung binh',
  })
  averageRating: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;
}
