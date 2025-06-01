import {Module} from '@nestjs/common'
import {CommentDataloaderService} from './comment-dataloader.service'
import {HasCommentResolver, HasOptionalCommentResolver} from './has-comment/has-comment.resolver'
import {CommentService} from './comment.service'
import {CommentResolver} from './comment.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {TagModule} from '@wepublish/tag/api'

@Module({
  imports: [PrismaModule, TagModule],
  providers: [
    CommentDataloaderService,
    HasCommentResolver,
    HasOptionalCommentResolver,
    CommentService,
    CommentResolver
  ],
  exports: [CommentDataloaderService, CommentService]
})
export class CommentModule {}
