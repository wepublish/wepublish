import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'beforeExit'>
  implements OnModuleInit
{
  constructor() {
    super();

    this.$use(async (params, next) => {
      const model = params.model ?? 'unknown';
      const action = params.action;

      return Sentry.startSpan(
        {
          name: `prisma:${model}.${action}`,
          op: 'db.query',
          attributes: {
            'db.system': 'postgresql',
            'db.operation': action,
            'db.prisma.model': model,
            [Sentry.SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.db.prisma',
          },
        },
        () => next(params)
      );
    });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
