import { UserInfo } from '../entities/user-info.entity';

export type PublicUserInfo = Omit<UserInfo, 'logoKey'> & {
  /** Signed CDN/view URL resolved at read time (not stored). */
  logoUrl?: string | null;
  logoKey?: never;
};

/** Strip storage keys; profile identity only (no SMTP / prefs). */
export function sanitizeUserInfo(
  info: UserInfo | null | undefined,
): PublicUserInfo | null {
  if (!info) return null;
  const { logoKey: _, ...rest } = info;
  return {
    ...rest,
    logoUrl: null,
  };
}
