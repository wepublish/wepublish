import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';
import { TagDataloader } from './tag.dataloader';
import { ArticleTagDataloader } from './article-tag.dataloader';
import { AuthorTagDataloader } from './author-tag.dataloader';
import { CommentTagDataloader } from './comment-tag.dataloader';
import { EventTagDataloader } from './event-tag.dataloader';
import { PageTagDataloader } from './page-tag.dataloader';

@Module({
  imports: [PrismaModule],
  providers: [
    TagDataloader,
    TagService,
    TagResolver,
    ArticleTagDataloader,
    AuthorTagDataloader,
    CommentTagDataloader,
    EventTagDataloader,
    PageTagDataloader,
  ],
  exports: [
    TagDataloader,
    ArticleTagDataloader,
    AuthorTagDataloader,
    CommentTagDataloader,
    EventTagDataloader,
    PageTagDataloader,
  ],
})
export class TagModule {}
