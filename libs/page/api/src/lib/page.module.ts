import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PageDataloaderService} from './page-dataloader.service'
import {HasPageResolver} from './has-page/has-page.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PageDataloaderService, HasPageResolver],
  exports: [PageDataloaderService]
})
export class PageModule {}
