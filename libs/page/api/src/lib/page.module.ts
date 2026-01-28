import { forwardRef, Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { PageDataloaderService } from './page-dataloader.service';
import { PageResolver } from './page.resolver';
import { PageService } from './page.service';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
import { PageRevisionResolver } from './page-revision.resolver';
import {
  HasOptionalPageLcResolver,
  HasOptionalPageResolver,
  HasPageLcResolver,
  HasPageResolver,
} from './has-page/has-page.resolver';
import { BlockContentModule } from '@wepublish/block-content/api';
import { TagModule } from '@wepublish/tag/api';
import { PropertyModule } from '@wepublish/property/api';

@Module({
  imports: [
    PrismaModule,
    ImageModule,
    TagModule,
    PropertyModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    PageDataloaderService,
    PageRevisionDataloaderService,
    PageService,
    PageResolver,
    PageRevisionResolver,
    HasPageResolver,
    HasPageLcResolver,
    HasOptionalPageResolver,
    HasOptionalPageLcResolver,
  ],
  exports: [PageDataloaderService, PageRevisionDataloaderService, PageService],
})
export class PageModule {}
