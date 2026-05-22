import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('tb_user_profile')
export class TBUserProfile extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Họ và tên',
  })
  fullName: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'URL avatar',
  })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL bìa' })
  coverUrl?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Số điện thoại',
  })
  phoneNumber: string;
}
