import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { AuthorDataloaderService } from './author-dataloader.service';
import {
  HasAuthorResolver,
  HasOptionalAuthorResolver,
} from './has-author/has-author.resolver';
import { AuthorService } from './author.service';
import { AuthorResolver } from './author.resolver';
import { TagModule } from '@wepublish/tag/api';
import { ArticleSocialMediaAuthorDataloader } from './article-social-media-author.dataloader';
import { ArticleAuthorDataloader } from './article-author.dataloader';

@Module({
  imports: [PrismaModule, TagModule],
  providers: [
    AuthorDataloaderService,
    AuthorService,
    AuthorResolver,
    HasAuthorResolver,
    HasOptionalAuthorResolver,
    ArticleSocialMediaAuthorDataloader,
    ArticleAuthorDataloader,
  ],
  exports: [
    AuthorDataloaderService,
    AuthorService,
    AuthorResolver,
    ArticleSocialMediaAuthorDataloader,
    ArticleAuthorDataloader,
  ],
})
export class AuthorModule {}
