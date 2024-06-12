import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {ScriptsController} from './scripts.controller'

@Module({
  controllers: [ScriptsController],
  providers: [],
  imports: [PrismaModule],
  exports: []
})
export class ScriptsModule {}
