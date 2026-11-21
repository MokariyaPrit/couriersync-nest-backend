import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  paginateMeta,
  PaginationDto,
  resolveSortPair,
} from '../common/dto/pagination.dto';
import { normalizeTermsList } from '../common/utils/terms-and-conditions';
import { UserConfig } from '../entities/user-config.entity';
import { UserInfo } from '../entities/user-info.entity';
import { User } from '../entities/user.entity';
import { sanitizeUserConfig } from '../mail/sanitize-user-config';
import { sanitizeUserInfo } from '../mail/sanitize-user-info';
import {
  encryptSmtpPassword,
  resolveSmtpCryptoSecret,
} from '../mail/smtp-crypto';
import { normalizeBookingTabConfigDto } from './dto/booking-tab-config.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SORT = [
  'email',
  'role',
  'createdAt',
  'isActive',
  'fullName',
  'expiredOn',
] as const;

type SmtpPatch = {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpFromEmail?: string | null;
};

type ConfigPatch = {
  sgstPercent?: number;
  cgstPercent?: number;
  igstPercent?: number;
  bookingTabConfig?: UpdateUserDto['bookingTabConfig'];
  termsAndConditions?: string[] | null;
  insurancePercent?: number;
  paymentDays?: number;
  volumetricDivisor?: number;
  ewayBillThreshold?: number;
  cargoPrintTemplate?: string;
} & SmtpPatch;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepo: Repository<UserInfo>,
    @InjectRepository(UserConfig)
    private readonly userConfigRepo: Repository<UserConfig>,
    private readonly config: ConfigService,
  ) {}

  private sanitize(user: User) {
    const { passwordHash: _, ...rest } = user;
    return {
      ...rest,
      userInfo: sanitizeUserInfo(user.userInfo),
      userConfig: sanitizeUserConfig(user.userConfig),
    };
  }

  private smtpSecret() {
    return resolveSmtpCryptoSecret(
      this.config.get<string>('SMTP_CRYPTO_SECRET'),
      this.config.get<string>('JWT_ACCESS_SECRET'),
    );
  }

  private applySmtpSettings(cfg: UserConfig, dto: SmtpPatch) {
    const clearingHost =
      dto.smtpHost !== undefined &&
      (dto.smtpHost == null || String(dto.smtpHost).trim() === '');

    if (clearingHost) {
      cfg.smtpHost = null;
      cfg.smtpPort = 587;
      cfg.smtpSecure = false;
      cfg.smtpUser = null;
      cfg.smtpPasswordEnc = null;
      cfg.smtpFromEmail = null;
      return;
    }

    if (dto.smtpHost !== undefined) {
      cfg.smtpHost = String(dto.smtpHost).trim() || null;
    }
    if (dto.smtpPort !== undefined) {
      cfg.smtpPort = dto.smtpPort ?? 587;
    }
    if (dto.smtpSecure !== undefined) {
      cfg.smtpSecure = Boolean(dto.smtpSecure);
    }
    if (dto.smtpUser !== undefined) {
      cfg.smtpUser =
        dto.smtpUser == null || String(dto.smtpUser).trim() === ''
          ? null
          : String(dto.smtpUser).trim();
    }
    if (dto.smtpFromEmail !== undefined) {
      cfg.smtpFromEmail =
        dto.smtpFromEmail == null || String(dto.smtpFromEmail).trim() === ''
          ? null
          : String(dto.smtpFromEmail).trim().toLowerCase();
    }
    if (
      dto.smtpPassword !== undefined &&
      dto.smtpPassword != null &&
      String(dto.smtpPassword).trim() !== ''
    ) {
      const password = String(dto.smtpPassword).replace(/\s+/g, '');
      cfg.smtpPasswordEnc = encryptSmtpPassword(password, this.smtpSecret());
    }

    if (cfg.smtpUser?.trim() && cfg.smtpPasswordEnc) {
      if (!cfg.smtpHost?.trim() || /gmail\.com$/i.test(cfg.smtpHost)) {
        cfg.smtpHost = 'smtp.gmail.com';
        cfg.smtpPort = 587;
        cfg.smtpSecure = false;
      }
      if (!cfg.smtpFromEmail?.trim()) {
        cfg.smtpFromEmail = cfg.smtpUser.trim().toLowerCase();
      }
    }
  }

  private defaultConfig(userId: string, dto?: Partial<ConfigPatch>): UserConfig {
    return this.userConfigRepo.create({
      userId,
      sgstPercent: String(dto?.sgstPercent ?? 9),
      cgstPercent: String(dto?.cgstPercent ?? 9),
      igstPercent: String(dto?.igstPercent ?? 0),
      bookingTabConfig:
        dto?.bookingTabConfig !== undefined
          ? normalizeBookingTabConfigDto(dto.bookingTabConfig)
          : null,
      termsAndConditions:
        dto?.termsAndConditions !== undefined
          ? normalizeTermsList(dto.termsAndConditions)
          : null,
      insurancePercent: String(dto?.insurancePercent ?? 2),
      paymentDays: dto?.paymentDays ?? 10,
      volumetricDivisor: dto?.volumetricDivisor ?? 5000,
      ewayBillThreshold: String(dto?.ewayBillThreshold ?? 50000),
      cargoPrintTemplate: dto?.cargoPrintTemplate ?? 'CLASSIC_GRID',
    });
  }

  private applyConfigPatch(cfg: UserConfig, dto: ConfigPatch) {
    if (dto.sgstPercent !== undefined) {
      cfg.sgstPercent = String(dto.sgstPercent);
    }
    if (dto.cgstPercent !== undefined) {
      cfg.cgstPercent = String(dto.cgstPercent);
    }
    if (dto.igstPercent !== undefined) {
      cfg.igstPercent = String(dto.igstPercent);
    }
    if (dto.bookingTabConfig !== undefined) {
      cfg.bookingTabConfig = normalizeBookingTabConfigDto(dto.bookingTabConfig);
    }
    if (dto.termsAndConditions !== undefined) {
      cfg.termsAndConditions = normalizeTermsList(dto.termsAndConditions);
    }
    if (dto.insurancePercent !== undefined) {
      cfg.insurancePercent = String(dto.insurancePercent);
    }
    if (dto.paymentDays !== undefined) cfg.paymentDays = dto.paymentDays;
    if (dto.volumetricDivisor !== undefined) {
      cfg.volumetricDivisor = dto.volumetricDivisor;
    }
    if (dto.ewayBillThreshold !== undefined) {
      cfg.ewayBillThreshold = String(dto.ewayBillThreshold);
    }
    if (dto.cargoPrintTemplate !== undefined) {
      cfg.cargoPrintTemplate = dto.cargoPrintTemplate;
    }
    if (
      dto.smtpHost !== undefined ||
      dto.smtpPort !== undefined ||
      dto.smtpSecure !== undefined ||
      dto.smtpUser !== undefined ||
      dto.smtpPassword !== undefined ||
      dto.smtpFromEmail !== undefined
    ) {
      this.applySmtpSettings(cfg, dto);
    }
  }

  async ensureConfig(userId: string): Promise<UserConfig> {
    let cfg = await this.userConfigRepo.findOne({ where: { userId } });
    if (!cfg) {
      cfg = await this.userConfigRepo.save(this.defaultConfig(userId));
    }
    return cfg;
  }

  async getConfig(userId: string) {
    const cfg = await this.ensureConfig(userId);
    return sanitizeUserConfig(cfg);
  }

  async updateConfig(userId: string, dto: ConfigPatch) {
    const cfg = await this.ensureConfig(userId);
    this.applyConfigPatch(cfg, dto);
    await this.userConfigRepo.save(cfg);
    return this.getConfig(userId);
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
      }),
    );

    const userInfo = await this.userInfoRepo.save(
      this.userInfoRepo.create({
        userId: user.id,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        email,
        address: dto.address ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        pincode: dto.pincode ?? null,
        companyName: dto.companyName ?? null,
        gstin: dto.gstin ?? null,
        panNumber: dto.panNumber ?? null,
        bankName: dto.bankName ?? null,
        bankAccountNo: dto.bankAccountNo ?? null,
        bankIfsc: dto.bankIfsc ?? null,
        upiId: dto.upiId ?? null,
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
        expiredOn: dto.expiredOn?.trim() ? dto.expiredOn.trim() : null,
      }),
    );

    const userConfig = await this.userConfigRepo.save(
      this.defaultConfig(user.id, {
        sgstPercent: dto.sgstPercent,
        cgstPercent: dto.cgstPercent,
        igstPercent: dto.igstPercent,
        termsAndConditions: dto.termsAndConditions,
        insurancePercent: dto.insurancePercent,
        paymentDays: dto.paymentDays,
        volumetricDivisor: dto.volumetricDivisor,
        ewayBillThreshold: dto.ewayBillThreshold,
      }),
    );

    return this.sanitize({ ...user, userInfo, userConfig });
  }

  async findAll(query: PaginationDto) {
    const { sortBy, sortOrder } = resolveSortPair(query, USER_SORT, {
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userInfo', 'userInfo')
      .leftJoinAndSelect('user.userConfig', 'userConfig')
      .where('user.deletedAt IS NULL')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    if (sortBy === 'fullName') {
      qb.orderBy('userInfo.fullName', sortOrder);
    } else if (sortBy === 'expiredOn') {
      qb.orderBy('userInfo.expiredOn', sortOrder);
    } else {
      qb.orderBy(`user.${sortBy}`, sortOrder);
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      data: items.map((u) => this.sanitize(u)),
      meta: paginateMeta(query.page, query.pageSize, total),
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: {
        userInfo: true,
        userConfig: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: {
        userInfo: true,
        userConfig: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      if (email !== user.email) {
        const exists = await this.usersRepo.findOne({ where: { email } });
        if (exists && exists.id !== user.id) {
          throw new ConflictException('Email already in use');
        }
        user.email = email;
      }
    }

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password !== undefined && dto.password.trim() !== '') {
      user.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    await this.usersRepo.save(user);

    let info = user.userInfo;
    if (!info) {
      info = this.userInfoRepo.create({
        userId: user.id,
        fullName: dto.fullName || user.email,
        email: user.email,
      });
    }

    if (dto.fullName !== undefined) info.fullName = dto.fullName;
    if (dto.phone !== undefined) info.phone = dto.phone;
    info.email = user.email;
    if (dto.address !== undefined) info.address = dto.address;
    if (dto.city !== undefined) info.city = dto.city;
    if (dto.state !== undefined) info.state = dto.state;
    if (dto.pincode !== undefined) info.pincode = dto.pincode;
    if (dto.companyName !== undefined) info.companyName = dto.companyName;
    if (dto.gstin !== undefined) info.gstin = dto.gstin;
    if (dto.panNumber !== undefined) info.panNumber = dto.panNumber;
    if (dto.bankName !== undefined) info.bankName = dto.bankName;
    if (dto.bankAccountNo !== undefined) info.bankAccountNo = dto.bankAccountNo;
    if (dto.bankIfsc !== undefined) info.bankIfsc = dto.bankIfsc;
    if (dto.upiId !== undefined) info.upiId = dto.upiId;
    if (dto.notes !== undefined) info.notes = dto.notes;
    if (dto.infoIsActive !== undefined) info.isActive = dto.infoIsActive;
    if (dto.expiredOn !== undefined) {
      const raw = dto.expiredOn;
      info.expiredOn =
        raw == null || String(raw).trim() === ''
          ? null
          : String(raw).trim().slice(0, 10);
    }

    await this.userInfoRepo.save(info);

    const hasConfigPatch =
      dto.sgstPercent !== undefined ||
      dto.cgstPercent !== undefined ||
      dto.igstPercent !== undefined ||
      dto.bookingTabConfig !== undefined ||
      dto.termsAndConditions !== undefined ||
      dto.insurancePercent !== undefined ||
      dto.paymentDays !== undefined ||
      dto.volumetricDivisor !== undefined ||
      dto.ewayBillThreshold !== undefined ||
      dto.cargoPrintTemplate !== undefined ||
      dto.smtpHost !== undefined ||
      dto.smtpPort !== undefined ||
      dto.smtpSecure !== undefined ||
      dto.smtpUser !== undefined ||
      dto.smtpPassword !== undefined ||
      dto.smtpFromEmail !== undefined;

    if (hasConfigPatch) {
      let cfg = user.userConfig;
      if (!cfg) {
        cfg = this.defaultConfig(user.id);
      }
      this.applyConfigPatch(cfg, dto);
      await this.userConfigRepo.save(cfg);
    }

    return this.findOne(id);
  }
}
