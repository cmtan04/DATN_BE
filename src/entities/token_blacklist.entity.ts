import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_token_blacklist')
export class TBTokenBlacklist {
  @PrimaryGeneratedColumn('increment', {
    comment: 'Primary key',
  })
  id: number;

  @Index('IDX_TOKEN_BLACKLIST_JTI', { unique: true })
  @Column({
    type: 'varchar',
    length: 36,
    comment: 'JWT ID (jti) của token bị thu hồi',
  })
  jti: string;

  @Column({
    type: 'int',
    comment: 'ID của user sở hữu token',
  })
  userId: number;

  @Column({
    type: 'timestamp',
    comment: 'Thời điểm token hết hạn — dùng để cleanup',
  })
  expiresAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    comment: 'Thời điểm token bị blacklist',
  })
  createdAt: Date;
}
