import {PrismaClient} from '@prisma/client'
import {DynamicModule} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'

export function registerPrismaModule(prismaClient: PrismaClient): DynamicModule {
  return {
    module: PrismaModule,
    providers: [
      {
        provide: PrismaClient,
        useFactory: () => prismaClient as PrismaService
      }
    ],
    exports: [PrismaService]
  }
}
