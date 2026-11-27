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
      // A user's password hash, TOTP secret and email-change token hash stay
      // out of every query result, nested relations included. The two places
      // that need a secret ask for it by name: the login lookup with
      // `omit: { password: false }`, the TOTP check with an explicit `select`.
      // The token hash is only ever matched in a `where`, never read.
      omit: {
        user: { password: true, totpSecret: true, pendingEmailTokenHash: true },
      },
    });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public async onModuleDestroy() {
    await this.$disconnect();
  }
}
