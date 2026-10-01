import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import {
  PublicationTimers,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';

const LOOKAHEAD_MS = 70_000;

@Injectable()
export class PagePublicationWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private logger = new Logger('PagePublicationWatcher');
  private timers = new PublicationTimers();

  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  onApplicationBootstrap() {
    return this.scheduleUpcoming();
  }

  onModuleDestroy() {
    this.timers.clear();
  }

  @Interval(60_000)
  async scheduleUpcoming() {
    const now = new Date();
    const where = {
      publishedAt: { gt: now, lte: new Date(now.getTime() + LOOKAHEAD_MS) },
    };

    try {
      const upcoming = await Promise.all([
        this.prisma.page.findMany({ where, select: { publishedAt: true } }),
        this.prisma.pageRevision.findMany({
          where,
          select: { publishedAt: true },
        }),
      ]);

      this.timers.schedule(
        upcoming
          .flat()
          .flatMap(({ publishedAt }) => (publishedAt ? [publishedAt] : [])),
        () => this.publicContentCache.invalidate('pages')
      );
    } catch (error) {
      this.logger.error(
        `Could not look up scheduled pages: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
