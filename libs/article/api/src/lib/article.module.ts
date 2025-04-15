import {forwardRef, Module} from '@nestjs/common'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {ArticleDataloaderService} from './article-dataloader.service'
import {ArticleResolver} from './article.resolver'
import {ArticleService} from './article.service'
import {ArticleRevisionDataloaderService} from './article-revision-dataloader.service'
import {ArticleRevisionResolver} from './article-revision.resolver'
import {ArticleRevisionService} from './article-revision.service'
import {AuthorModule} from '@wepublish/author/api'
import {
  HasArticleLcResolver,
  HasArticleResolver,
  HasOptionalArticleLcResolver,
  HasOptionalArticleResolver
} from './has-article/has-article.resolver'
import {BlockContentModule} from '@wepublish/block-content/api'
import {SettingModule} from '@wepublish/settings/api'

@Module({
  imports: [
    PrismaModule,
    ImageModule,
    AuthorModule,
    SettingModule,
    forwardRef(() => BlockContentModule)
  ],
  providers: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleResolver,
    ArticleRevisionResolver,
    ArticleRevisionService,
    HasArticleResolver,
    HasArticleLcResolver,
    HasOptionalArticleResolver,
    HasOptionalArticleLcResolver
  ],
  exports: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleRevisionService
  ]
})
export class ArticleModule {}
