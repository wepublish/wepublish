import {Module} from '@nestjs/common'
import {OldContextService} from './oldContext.service'

@Module({
  providers: [OldContextService],
  exports: [OldContextService]
})
export class OldContextModule {}
