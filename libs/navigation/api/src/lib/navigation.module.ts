import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {NavigationService} from './navigation.service'
import {NavigationResolver} from './navigation.resolver'
import {NavigationDataloader} from './navigation.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [NavigationService, NavigationDataloader, NavigationResolver]
})
export class NavigationModule {}
