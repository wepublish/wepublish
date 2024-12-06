import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {NavigationService} from './navigation.service'
import {NavigationDataloader} from './navigation.dataloader'
import {PageModule} from '@wepublish/page/api'
import {ArticleModule} from '@wepublish/article/api'
import {NavigationResolver} from './navigation.resolver'

@Module({
  imports: [PrismaModule, PageModule, ArticleModule],
  providers: [NavigationService, NavigationDataloader, NavigationResolver]
})
export class NavigationModule {}
