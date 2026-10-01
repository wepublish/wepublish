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
    const window = { gt: now, lte: until };
    const inWindow = (date: Date | null): date is Date =>
      !!date && date > now && date <= until;

    try {
      const events = await this.prisma.event.findMany({
        where: { OR: [{ startsAt: window }, { endsAt: window }] },
        select: { startsAt: true, endsAt: true },
      });

      this.timers.schedule(
        events.flatMap(({ startsAt, endsAt }) =>
          [startsAt, endsAt].filter(inWindow)
        ),
        () => this.publicContentCache.invalidate()
      );
    } catch (error) {
      this.logger.error(
        `Could not look up starting or ending events: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
