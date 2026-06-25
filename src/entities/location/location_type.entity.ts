import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { TBLocation } from './location.entity';

@Entity('tb_location_type')
export class TBLocationType extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 127,
    nullable: false,
    comment: 'Tên loại địa điểm',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 15,
    nullable: false,
    comment: 'Mã loại địa điểm',
  })
  code: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Có thể có nhiều phòng',
  })
  canHaveMultiRoom: boolean;

  @OneToMany(() => TBLocation, (location) => location.type)
  locations: TBLocation[];
}
