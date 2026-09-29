import { PdfRendererType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { BasePdfRenderer } from './base-pdf-renderer';
import { CloudflarePdfRenderer } from './cloudflare-pdf-renderer';

export type PdfRendererDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
};

export const createPdfRenderer = (
  id: string,
  type: PdfRendererType,
  { prisma, kv }: PdfRendererDeps
): BasePdfRenderer => {
  switch (type) {
    case PdfRendererType.cloudflare:
      return new CloudflarePdfRenderer({
        id,
        prisma,
        kv,
        fallback: {
          accountId: process.env['CLOUDFLARE_ACCOUNT_ID'],
          apiToken: process.env['CLOUDFLARE_API_TOKEN'],
        },
      });
    default:
      throw new Error(`Unknown pdf renderer type defined: ${type}`);
  }
};

export const loadPdfRenderer = async (
  deps: PdfRendererDeps
): Promise<BasePdfRenderer | null> => {
  const row = await deps.prisma.settingPdfRenderer.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!row) {
    return null;
  }

  return createPdfRenderer(row.id, row.type, deps);
};
