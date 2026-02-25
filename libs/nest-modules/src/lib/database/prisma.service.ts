import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'beforeExit' | 'query'>
  implements OnModuleInit
{
  public async onModuleInit() {
    this.setupSentryTracing();
    await this.$connect();
  }

  private setupSentryTracing() {
    if (!Sentry.getClient()) {
      return;
    }

    // Query event captures raw SQL - fires after each query with duration
    this.$on('query', (event: Prisma.QueryEvent) => {
      const span = Sentry.startInactiveSpan({
        name: 'prisma:engine:db_query',
        op: 'db.sql.query',
        startTime: Date.now() - event.duration,
        attributes: {
          'db.system': 'prisma',
          'db.statement': event.query,
          'db.query.params': event.params,
          'db.query.duration_ms': event.duration,
          'db.target': event.target,
        },
      });
      span?.end();
    });

    // Middleware captures operation-level timing (e.g., findMany with includes)
    this.$use(async (params, next) => {
      const model = params.model ?? 'unknown';
      const action = params.action;

      return Sentry.startSpan(
        {
          name: `prisma:${model}.${action}`,
          op: 'db.prisma',
          attributes: {
            'db.system': 'prisma',
            'db.operation': action,
            'db.prisma.model': model,
          },
        },
        () => next(params)
      );
    });
  }

  public async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
