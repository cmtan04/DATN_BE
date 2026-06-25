import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TBLocation } from './location.entity';
import { TBService } from '../service.entity';

@Entity('tb_location_service')
export class TBLocationService {
  @PrimaryColumn({
    type: 'int',
    nullable: false,
    comment: 'ID địa điểm',
    primary: true,
  })
  locationId: number;

  @PrimaryColumn({
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

  @ManyToOne(() => TBLocation, (location) => location.services)
  @JoinColumn({ name: 'locationId' })
  location: TBLocation;

  @ManyToOne(() => TBService)
  @JoinColumn({ name: 'serviceId' })
  service: TBService;
}
