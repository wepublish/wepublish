import {forwardRef, Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {PageDataloaderService} from './page-dataloader.service'
import {PageResolver} from './page.resolver'
import {PageService} from './page.service'
import {PageRevisionDataloaderService} from './page-revision-dataloader.service'
import {PageRevisionResolver} from './page-revision.resolver'
import {PageRevisionService} from './page-revision.service'
import {
  HasOptionalPageLcResolver,
  HasOptionalPageResolver,
  HasPageLcResolver,
  HasPageResolver
} from './has-page/has-page.resolver'
import {BlockContentModule} from '@wepublish/block-content/api'
import {SettingModule} from '@wepublish/settings/api'

@Module({
  imports: [PrismaModule, ImageModule, SettingModule, forwardRef(() => BlockContentModule)],
  providers: [
    PageDataloaderService,
    PageRevisionDataloaderService,
    PageService,
    PageResolver,
    PageRevisionResolver,
    PageRevisionService,
    HasPageResolver,
    HasPageLcResolver,
    HasOptionalPageResolver,
    HasOptionalPageLcResolver
  ],
  exports: [PageDataloaderService, PageRevisionDataloaderService, PageService, PageRevisionService]
})
export class PageModule {}
