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
import { PropertyModule } from '@wepublish/property/api';

@Module({
  imports: [
    PrismaModule,
    ImageModule,
    AuthorModule,
    SettingModule,
    TagModule,
    PropertyModule,
    forwardRef(() => BlockContentModule),
  ],
  providers: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleResolver,
    ArticleRevisionResolver,

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
