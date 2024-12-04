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
import {HasArticleResolver} from './has-article/has-article.resolver'
import {BlockContentModule} from '@wepublish/block-content/api'

@Module({
  imports: [PrismaModule, ImageModule, AuthorModule, forwardRef(() => BlockContentModule)],
  providers: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleResolver,
    ArticleRevisionResolver,
    ArticleRevisionService,
    HasArticleResolver
  ],
  exports: [
    ArticleDataloaderService,
    ArticleRevisionDataloaderService,
    ArticleService,
    ArticleRevisionService,
    HasArticleResolver
  ]
})
export class ArticleModule {}
