import { TrackingProvider } from '@/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateCourierCompanyDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  companyLink?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(TrackingProvider)
  trackingProvider?: TrackingProvider | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourierCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  companyLink?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEnum(TrackingProvider)
  trackingProvider?: TrackingProvider | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourierCompanyPrefDto {
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CourierCompanyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  activeOnly?: boolean;
}
