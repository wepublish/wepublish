import {Module} from '@nestjs/common'
import {PageResolver} from './page.resolver'
import {PageService} from './page.service'
import {PageDataloader} from './page.dataloader'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  imports: [PrismaModule],
  providers: [PageResolver, PageService, PageDataloader],
  exports: [PageDataloader]
})
export class PageModule {}
