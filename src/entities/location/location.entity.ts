import { BaseEntity } from '../base.entity';
import { Column, Entity } from 'typeorm';

@Entity('tb_location')
export class TBLocation extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Mã địa điểm',
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Tên địa điểm',
  })
  name: string;

  @Column({ type: 'int', nullable: false, comment: 'ID người sở hữu' })
  ownerId: number;

  @Column({ type: 'int', nullable: false, comment: 'Giá' })
  price: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Đơn vị tính',
  })
  priceUnit: string;

  @Column({ type: 'int', nullable: false, comment: 'Diện tích' })
  area: number;
}
