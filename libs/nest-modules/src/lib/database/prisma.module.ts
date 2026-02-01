import { DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
    PrismaService,
  ],
  exports: [PrismaClient, PrismaService],
})
export class PrismaModule {
  // https://github.com/prisma/prisma/discussions/4399#discussioncomment-3126122
  static forTest(prismaClient: PrismaClient): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaClient,
          useFactory: () => prismaClient as PrismaService,
        },
      ],
      exports: [PrismaClient, PrismaService],
    };
  }
}
