import { BaseEntity } from '../base.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { TBLocation } from './location.entity';

@Entity('tb_location_address')
export class TBLocationAddress extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Địa chỉ đầy đủ',
  })
  fullAddress: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Tỉnh/Thành phố',
  })
  province: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Quận/Huyện',
  })
  district: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Quốc gia',
  })
  country: string;

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Khu vực' })
  region: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: false,
    comment: 'Kinh độ',
  })
  lat: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: false,
    comment: 'Vĩ độ',
  })
  lng: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  normalFullAddress: string;

  @OneToOne(() => TBLocation, (location) => location.address)
  location: TBLocation;
}
