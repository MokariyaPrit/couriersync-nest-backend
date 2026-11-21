import { CargoPrintTemplate } from '@/shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BookingTabConfigDto } from '../../users/dto/booking-tab-config.dto';

/** Logged-in user updates own preferences / integrations */
export class UpdateUserConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sgstPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cgstPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  igstPercent?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingTabConfigDto)
  bookingTabConfig?: BookingTabConfigDto | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  termsAndConditions?: string[] | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insurancePercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volumetricDivisor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ewayBillThreshold?: number;

  @IsOptional()
  @IsEnum(CargoPrintTemplate)
  cargoPrintTemplate?: CargoPrintTemplate;

  /** Blank host clears all SMTP settings */
  @IsOptional()
  @IsString()
  smtpHost?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number | null;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string | null;

  /** Blank / omitted = keep existing password */
  @IsOptional()
  @IsString()
  smtpPassword?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail()
  smtpFromEmail?: string | null;
}
