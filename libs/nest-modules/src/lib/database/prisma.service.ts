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
      max: parseInt(process.env['DATABASE_POOL_SIZE'] ?? '20'),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    });

    super({ adapter });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public async onModuleDestroy() {
    await this.$disconnect();
  }
}
