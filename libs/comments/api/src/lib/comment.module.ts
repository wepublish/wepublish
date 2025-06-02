import {Module} from '@nestjs/common'
import {CommentDataloaderService} from './comment-dataloader.service'
import {HasCommentResolver, HasOptionalCommentResolver} from './has-comment/has-comment.resolver'
import {CommentService} from './comment.service'
import {CommentResolver} from './comment.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {TagModule} from '@wepublish/tag/api'
import {RatingSystemResolver, RatingSystemService} from './rating-system'

@Module({
  imports: [PrismaModule, TagModule],
  providers: [
    CommentDataloaderService,
    HasCommentResolver,
    HasOptionalCommentResolver,
    CommentService,
    RatingSystemService,
    CommentResolver,
    RatingSystemResolver
  ],
  exports: [CommentDataloaderService, CommentService, RatingSystemService]
})
export class CommentModule {}
