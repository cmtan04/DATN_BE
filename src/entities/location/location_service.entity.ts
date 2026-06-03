import { Column, Entity } from 'typeorm';

@Entity('tb_location_service')
export class TBLocationService {
  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID địa điểm',
    primary: true,
  })
  locationId: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID dịch vụ',
    primary: true,
  })
  serviceId: number;

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
