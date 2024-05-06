import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {NavigationService} from './navigation.service'
import {NavigationResolver} from './navigation.resolver'

@Module({
  imports: [PrismaModule],
  providers: [NavigationService, NavigationResolver]
})
export class NavigationModule {}
