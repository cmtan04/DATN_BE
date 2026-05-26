import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('tb_location_media')
export class TBLocationMedia extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Loai media',
  })
  type: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'URL cua media',
  })
  url: string;

  @Column({ type: 'int', nullable: false, comment: 'Thu tu hien thi' })
  displayOrder: number;

  @Column({ type: 'int', nullable: true, comment: 'Primary key' })
  locationId?: number;
}
