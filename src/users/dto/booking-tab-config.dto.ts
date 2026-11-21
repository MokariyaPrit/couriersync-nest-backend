import { IsArray, IsOptional, IsString } from 'class-validator';

export class BookingTabConfigDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  account?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cash?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cargoAccount?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cargoCash?: string[];
}

export type BookingTabConfigShape = {
  account: string[];
  cash: string[];
  cargoAccount: string[];
  cargoCash: string[];
};

function cleanKeys(raw?: string[]): string[] {
  return Array.isArray(raw)
    ? raw.filter((k) => typeof k === 'string' && k.trim())
    : [];
}

export function normalizeBookingTabConfigDto(
  raw?: BookingTabConfigDto | null,
): BookingTabConfigShape | null {
  if (!raw) return null;
  return {
    account: cleanKeys(raw.account),
    cash: cleanKeys(raw.cash),
    cargoAccount: cleanKeys(raw.cargoAccount),
    cargoCash: cleanKeys(raw.cargoCash),
  };
}
