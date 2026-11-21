import { Role } from '@/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserConfig } from './user-config.entity';
import { UserInfo } from './user-info.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToOne(() => UserInfo, (info) => info.user)
  userInfo: UserInfo | null;

  @OneToOne(() => UserConfig, (cfg) => cfg.user)
  userConfig: UserConfig | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
