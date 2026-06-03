import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tb_service')
export class TBService {
  @PrimaryGeneratedColumn({
    type: 'int',
    comment: 'ID dịch vụ',
  })
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Tên dịch vụ',
  })
  name: string;
}
