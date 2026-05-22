import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('tb_location_service')
export class TBLocationService extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Tên dịch vụ',
  })
  name: string;

  @Column({ type: 'int', nullable: true, comment: 'Giá' })
  price?: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Đơn vị tính',
  })
  priceUnit?: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  isFree: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;
}
