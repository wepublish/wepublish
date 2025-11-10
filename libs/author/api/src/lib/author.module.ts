import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { AuthorDataloaderService } from './author-dataloader.service';
import {
  HasAuthorResolver,
  HasOptionalAuthorResolver,
} from './has-author/has-author.resolver';
import { AuthorService } from './author.service';
import { AuthorResolver } from './author.resolver';
import { ArticleAuthorsService } from './article-authors.service';
import { TagModule } from '@wepublish/tag/api';

@Module({
  imports: [PrismaModule, TagModule],
  providers: [
    AuthorDataloaderService,
    AuthorService,
    ArticleAuthorsService,
    AuthorResolver,
    HasAuthorResolver,
    HasOptionalAuthorResolver,
  ],
  exports: [
    AuthorDataloaderService,
    AuthorService,
    AuthorResolver,
    ArticleAuthorsService,
  ],
})
export class AuthorModule {}
