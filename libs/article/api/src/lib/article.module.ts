import { PublicContentInvalidatorModule } from '@wepublish/public-content-cache/api';
import { ArticlePublicationWatcher } from './article-publication.watcher';
import { forwardRef, Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ArticleDataloaderService } from './article-dataloader.service';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';
import { ArticleRevisionDataloaderService } from './article-revision-dataloader.service';
import { ArticleRevisionResolver } from './article-revision.resolver';
import { AuthorModule } from '@wepublish/author/api';
import {
  HasArticleLcResolver,
  HasArticleResolver,
  HasOptionalArticleLcResolver,
  HasOptionalArticleResolver,
} from './has-article/has-article.resolver';
import { BlockContentModule } from '@wepublish/block-content/api';
import { SettingModule } from '@wepublish/settings/api';
import { TagModule } from '@wepublish/tag/api';
import { EngagementModule } from '@wepublish/engagement/api';
import { PaywallModule } from '@wepublish/paywall/api';
import { ArticleAccessService } from './article-access.service';
import { ViewArticleResolver } from './view-article.resolver';

@Module({
  imports: [
    PublicContentInvalidatorModule,
    PrismaModule,
    ImageModule,
    AuthorModule,
    SettingModule,
    TagModule,
    EngagementModule,
    PaywallModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    ArticlePublicationWatcher,
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleResolver,
    ArticleRevisionResolver,
    ArticleAccessService,
    ViewArticleResolver,

    HasArticleResolver,
    HasArticleLcResolver,
    HasOptionalArticleResolver,
    HasOptionalArticleLcResolver,
  ],
  exports: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
  ],
})
export class ArticleModule {}
