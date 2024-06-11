import {Module} from '@nestjs/common'
import {ActionResolver} from './action.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {ActionService} from './action.service'

@Module({
  imports: [PrismaModule],
  providers: [ActionResolver, ActionService],
  exports: []
})
export class ActionModule {}
