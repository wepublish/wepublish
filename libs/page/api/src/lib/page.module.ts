import { PublicContentInvalidatorModule } from '@wepublish/public-content-cache/api';
import { PagePublicationWatcher } from './page-publication.watcher';
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
import {
  BlockContentModule,
  BlockTemplateModule,
} from '@wepublish/block-content/api';
import { TagModule } from '@wepublish/tag/api';
import {
  PageTemplateMetadataResolver,
  PageTemplateResolver,
} from './page-template/page-template.resolver';
import { PageTemplateService } from './page-template/page-template.service';

@Module({
  imports: [
    PublicContentInvalidatorModule,
    PrismaModule,
    ImageModule,
    TagModule,
    forwardRef(() => BlockContentModule),
    forwardRef(() => BlockTemplateModule),
  ],
  providers: [
    PagePublicationWatcher,
    PageDataloaderService,
    PageRevisionDataloaderService,
    PageService,
    PageResolver,
    PageRevisionResolver,
    PageTemplateService,
    PageTemplateResolver,
    PageTemplateMetadataResolver,
    HasPageResolver,
    HasPageLcResolver,
    HasOptionalPageResolver,
    HasOptionalPageLcResolver,
  ],
  exports: [PageDataloaderService, PageRevisionDataloaderService, PageService],
})
export class PageModule {}
