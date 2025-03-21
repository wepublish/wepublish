import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CommentDataloaderService} from './comment-dataloader.service'
import {HasCommentResolver, HasOptionalCommentResolver} from './has-comment/has-comment.resolver'

@Module({
  imports: [PrismaModule],
  providers: [CommentDataloaderService, HasCommentResolver, HasOptionalCommentResolver],
  exports: [CommentDataloaderService]
})
export class CommentModule {}
