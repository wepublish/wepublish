import {DynamicModule, Module} from '@nestjs/common'
import {PrismaService} from './prisma.service'
import {PrismaClient} from '@prisma/client'

@Module({
  providers: [
    {
      provide: PrismaClient,
      useClass: PrismaService
    }
  ],
  exports: [PrismaClient]
})
export class PrismaModule {
  // https://github.com/prisma/prisma/discussions/4399#discussioncomment-3126122
  static forTest(prismaClient: PrismaClient): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: () => prismaClient as PrismaService
        }
      ],
      exports: [PrismaService]
    }
  }
}
