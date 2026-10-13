import { LetterProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { BaseLetterProvider } from './base-letter-provider';
import { PingenLetterProvider } from './pingen-letter-provider';

export type LetterProviderDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
};

export const createLetterProvider = (
  id: string,
  type: LetterProviderType,
  { prisma, kv }: LetterProviderDeps
): BaseLetterProvider => {
  switch (type) {
    case LetterProviderType.pingen:
      return new PingenLetterProvider({ id, prisma, kv });
    default:
      throw new Error(`Unknown letter provider type defined: ${type}`);
  }
};

export const loadLetterProvider = async (
  deps: LetterProviderDeps
): Promise<BaseLetterProvider | null> => {
  const row = await deps.prisma.settingLetterProvider.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!row) {
    return null;
  }

  return createLetterProvider(row.id, row.type, deps);
};
