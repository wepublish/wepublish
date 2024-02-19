import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {TerminusModule} from '@nestjs/terminus'
import {HealthController} from '@wepublish/health'

@Module({
  imports: [PrismaModule, TerminusModule],
  controllers: [HealthController]
})
export class HealthModule {}
