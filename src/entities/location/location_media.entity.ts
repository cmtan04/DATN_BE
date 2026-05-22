import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('tb_location_media')
export class TBLocationMedia extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Loại media (hình ảnh, video, ...)',
  })
  type: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'URL của media',
  })
  url: string;

  @Column({ type: 'int', nullable: false, comment: 'Thứ tự hiển thị' })
  displayOrder: number;
}
