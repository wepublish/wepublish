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
const LONGEST_SCHEDULE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ArticlePublicationWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private logger = new Logger('ArticlePublicationWatcher');
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

  schedule(publishedAt: Date) {
    const wait = publishedAt.getTime() - Date.now();

    if (wait <= 0 || wait > LONGEST_SCHEDULE_MS) {
      return;
    }

    this.timers.schedule([publishedAt], () => this.publish(publishedAt));
  }

  @Interval(60_000)
  async scheduleUpcoming() {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const from =
      this.coveredUntil && this.coveredUntil < now ? this.coveredUntil : now;
    const where = { publishedAt: { gt: from, lte: until } };

    try {
      const upcoming = await Promise.all([
        this.prisma.article.findMany({ where, select: { publishedAt: true } }),
        this.prisma.articleRevision.findMany({
          where,
          select: { publishedAt: true },
        }),
      ]);

      for (const { publishedAt } of upcoming.flat()) {
        if (publishedAt) {
          this.timers.schedule([publishedAt], () => this.publish(publishedAt));
        }
      }

      this.coveredUntil = until;
    } catch (error) {
      this.logger.error(
        `Could not look up scheduled articles: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async publish(publishedAt: Date) {
    const [articles, revisions] = await Promise.all([
      this.prisma.article.findMany({
        where: { publishedAt },
        select: { id: true, slug: true },
      }),
      this.prisma.articleRevision.findMany({
        where: { publishedAt },
        select: { article: { select: { id: true, slug: true } } },
      }),
    ]);

    await this.publicContentCache.invalidate('articles');
    await this.publicContentCache.invalidateArticlePages(
      ...articles,
      ...revisions.map(({ article }) => article)
    );
  }
}
