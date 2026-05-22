import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

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
}
