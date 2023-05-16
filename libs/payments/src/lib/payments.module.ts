import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentsService} from './payments.service'

@Module({
  imports: [PrismaModule],
  providers: [PaymentsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
