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
export class EventScheduleWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private logger = new Logger('EventScheduleWatcher');
  private timers = new PublicationTimers();
  private coveredUntil?: Date;

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
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const from =
      this.coveredUntil && this.coveredUntil < now ? this.coveredUntil : now;
    const window = { gt: from, lte: until };
    const inWindow = (date: Date | null): date is Date =>
      !!date && date > from && date <= until;

    try {
      const [occurrences, revisions] = await Promise.all([
        this.prisma.occurrence.findMany({
          where: { OR: [{ dateFrom: window }, { dateTo: window }] },
          select: { dateFrom: true, dateTo: true },
        }),
        this.prisma.eventRevision.findMany({
          where: { publishedAt: window },
          select: { publishedAt: true },
        }),
      ]);

      this.timers.schedule(
        [
          ...occurrences.flatMap(({ dateFrom, dateTo }) => [dateFrom, dateTo]),
          ...revisions.map(({ publishedAt }) => publishedAt),
        ].filter(inWindow),
        () => this.publicContentCache.invalidate('events')
      );

      this.coveredUntil = until;
    } catch (error) {
      this.logger.error(
        `Could not look up starting or ending occurrences: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
