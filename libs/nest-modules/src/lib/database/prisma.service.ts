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

    if (connectionString) {
      const adapter = new PrismaPg({ connectionString });
      super({ adapter });
    } else {
      // Allow instantiation without a DB connection (e.g. unit tests)
      super({ adapter: new PrismaPg({ connectionString: 'postgresql://' }) });
    }
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public async onModuleDestroy() {
    await this.$disconnect();
  }
}
