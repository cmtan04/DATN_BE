import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { TBLocation } from './location.entity';

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

  @Column({ type: 'int', nullable: false, comment: 'Id cua location' })
  locationId: number;

  @ManyToOne(() => TBLocation, (location) => location.media)
  @JoinColumn({ name: 'locationId' })
  location: TBLocation;
}
