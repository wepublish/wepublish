import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    const adapter = new PrismaPg({
      connectionString: connectionString ?? 'postgresql://',
      options: '-c timezone=UTC',
      max: parseInt(process.env['DATABASE_POOL_SIZE'] ?? '20'),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 300_000,
    });

    super({
      adapter,
      // A user's password hash and TOTP secret stay out of every query result,
      // nested relations included. The two places that need them ask for them
      // by name: the login lookup with `omit: { password: false }`, the TOTP
      // check with an explicit `select`.
      omit: { user: { password: true, totpSecret: true } },
    });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public async onModuleDestroy() {
    await this.$disconnect();
  }
}
