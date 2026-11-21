import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/** Profile / letterhead identity for a user (not app preferences). */
@Entity('user_info')
export class UserInfo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.userInfo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'varchar', nullable: true })
  pincode: string | null;

  @Column({ type: 'varchar', nullable: true })
  companyName: string | null;

  /** R2 object key for company logo */
  @Column({ type: 'varchar', nullable: true })
  logoKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', nullable: true })
  bankAccountNo: string | null;

  @Column({ type: 'varchar', nullable: true })
  bankIfsc: string | null;

  @Column({ type: 'varchar', nullable: true })
  upiId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Last calendar day the account may log in.
   * Null = no expiry. Admin-editable.
   */
  @Column({ type: 'date', nullable: true })
  expiredOn: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
