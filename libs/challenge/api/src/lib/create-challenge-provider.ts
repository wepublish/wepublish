import { ChallengeProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { ChallengeProvider } from './challenge-provider.interface';
import { CFTurnstileProvider } from './providers/cf-turnstile.provider';
import { HCaptchaProvider } from './providers/h-captcha.provider';

export type ChallengeProviderDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
};

export const createChallengeProvider = (
  id: string,
  type: ChallengeProviderType,
  { prisma, kv }: ChallengeProviderDeps
): ChallengeProvider => {
  switch (type) {
    case ChallengeProviderType.HCAPTCHA:
      return new HCaptchaProvider(id, prisma, kv);
    case ChallengeProviderType.TURNSTILE:
      return new CFTurnstileProvider(id, prisma, kv);
    default:
      throw new Error(`Unknown challenge provider type defined: ${type}`);
  }
};

export const loadChallengeProvider = async (
  deps: ChallengeProviderDeps
): Promise<ChallengeProvider | null> => {
  // A singleton: whichever row exists is the active one.
  const row = await deps.prisma.settingChallengeProvider.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!row) {
    return null;
  }

  return createChallengeProvider(row.id, row.type, deps);
};
