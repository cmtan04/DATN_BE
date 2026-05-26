import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('tb_user_default')
export class TBUserDefault extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Ten nguoi dung',
  })
  userName: string;

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Email' })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Mat khau',
  })
  password: string;

  @Column({ type: 'int', nullable: false, comment: 'Vai tro' })
  userRole: number;

  @Column({ type: 'int', nullable: false, comment: 'Trang thai' })
  status: number;

  @Column({ type: 'boolean', default: false, comment: 'Trang thai xac thuc email' })
  isEmailVerified: boolean;

  @Column({ type: 'int', nullable: true, comment: 'Primary key' })
  userProfileId?: number;
}
