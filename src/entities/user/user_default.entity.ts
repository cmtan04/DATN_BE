import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { OwnerRequestStatus } from '@assets/enum/user.enum';

@Entity('tb_user_default')
export class TBUserDefault extends BaseEntity {
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

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Trang thai xac thuc email',
  })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isApplyingForOwner?: boolean;

  @Column({
    type: 'int',
    nullable: false,
    default: OwnerRequestStatus.NONE,
    comment: 'Trang thai xin lam chu phong',
  })
  ownerRequestStatus: number;

  @Column({ type: 'int', nullable: true, comment: 'Primary key' })
  userProfileId?: number;
}
