import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {NavigationService} from './navigation.service'
import {NavigationResolver} from './navigation.resolver'
import {NavigationDataloader} from './navigation.dataloader'
import {ArticleNavigationLinkResolver} from './article-navigation-link.resolver'
import {PageNavigationLinkResolver} from './page-navigation-link.resolver'

@Module({
  imports: [PrismaModule],
  providers: [
    NavigationService,
    NavigationDataloader,
    NavigationResolver,
    ArticleNavigationLinkResolver,
    PageNavigationLinkResolver
  ]
})
export class NavigationModule {}
