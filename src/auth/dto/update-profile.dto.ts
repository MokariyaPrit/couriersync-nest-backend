import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** Logged-in user updates own profile — identity / letterhead only */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  state?: string | null;

  @IsOptional()
  @IsString()
  pincode?: string | null;

  @IsOptional()
  @IsString()
  companyName?: string | null;

  @IsOptional()
  @IsString()
  gstin?: string | null;

  @IsOptional()
  @IsString()
  panNumber?: string | null;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  bankAccountNo?: string | null;

  @IsOptional()
  @IsString()
  bankIfsc?: string | null;

  @IsOptional()
  @IsString()
  upiId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
