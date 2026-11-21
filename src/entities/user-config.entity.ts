import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_config')
export class UserConfig {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.userConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Default billing GST rates (%) */
  @Column({ type: 'numeric', precision: 8, scale: 2, default: 9 })
  sgstPercent: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 9 })
  cgstPercent: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0 })
  igstPercent: string;

  /**
   * Per-user booking Tab order: which fields receive focus.
   * Shape: { account: string[], cash: string[] }
   */
  @Column({ type: 'jsonb', nullable: true })
  bookingTabConfig: { account: string[]; cash: string[] } | null;

  /**
   * Quotation / contract Terms & Conditions lines.
   * Null = use system defaults.
   */
  @Column({ type: 'jsonb', nullable: true })
  termsAndConditions: string[] | null;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 2 })
  insurancePercent: string;

  @Column({ type: 'int', default: 10 })
  paymentDays: number;

  @Column({ type: 'int', default: 5000 })
  volumetricDivisor: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 50000 })
  ewayBillThreshold: string;

  @Column({ type: 'varchar', length: 32, default: 'CLASSIC_GRID' })
  cargoPrintTemplate: string;

  @Column({ type: 'varchar', nullable: true })
  smtpHost: string | null;

  @Column({ type: 'int', nullable: true, default: 587 })
  smtpPort: number | null;

  @Column({ type: 'boolean', default: false })
  smtpSecure: boolean;

  @Column({ type: 'varchar', nullable: true })
  smtpUser: string | null;

  /** AES-GCM ciphertext; never returned via API */
  @Column({ type: 'text', nullable: true })
  smtpPasswordEnc: string | null;

  @Column({ type: 'varchar', nullable: true })
  smtpFromEmail: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
