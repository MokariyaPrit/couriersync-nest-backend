import { UserConfig } from '../entities/user-config.entity';

export type PublicUserConfig = Omit<UserConfig, 'smtpPasswordEnc'> & {
  smtpConfigured: boolean;
  smtpPasswordEnc?: never;
};

/** Strip SMTP secret; expose smtpConfigured for the client. */
export function sanitizeUserConfig(
  cfg: UserConfig | null | undefined,
): PublicUserConfig | null {
  if (!cfg) return null;
  const { smtpPasswordEnc: _, ...rest } = cfg;
  return {
    ...rest,
    smtpConfigured: Boolean(
      cfg.smtpHost?.trim() &&
        cfg.smtpUser?.trim() &&
        cfg.smtpPasswordEnc?.trim(),
    ),
  };
}
