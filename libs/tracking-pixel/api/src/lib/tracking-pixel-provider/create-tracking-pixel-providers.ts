import { HttpService } from '@nestjs/axios';
import { PrismaClient, TrackingPixelProviderType } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { ProlitterisTrackingPixelProvider } from './prolitteris/prolitteris-tracking-pixel-provider';
import { TrackingPixelProvider } from './tracking-pixel-provider';

export type TrackingPixelProviderDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
  httpClient: HttpService;
};

export const createTrackingPixelProvider = (
  id: string,
  type: TrackingPixelProviderType,
  { prisma, kv, httpClient }: TrackingPixelProviderDeps
): TrackingPixelProvider => {
  switch (type) {
    case TrackingPixelProviderType.prolitteris:
      return new ProlitterisTrackingPixelProvider(id, prisma, kv, httpClient);
    default:
      throw new Error(`Unknown tracking pixel type defined: ${type}`);
  }
};

export const loadTrackingPixelProviders = async (
  deps: TrackingPixelProviderDeps
): Promise<TrackingPixelProvider[]> => {
  // Soft-deleted providers are loaded too: pixels already reported keep
  // resolving against the provider that reported them.
  const rows = await deps.prisma.settingTrackingPixel.findMany({
    orderBy: { id: 'asc' },
  });

  return rows.map(row => createTrackingPixelProvider(row.id, row.type, deps));
};
