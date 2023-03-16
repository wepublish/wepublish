import {Module} from '@nestjs/common'
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
export class PrismaModule {}
