import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CommentDataloaderService} from './comment-dataloader.service'
import {HasCommentResolver} from './has-comment/has-comment.resolver'

@Module({
  imports: [PrismaModule],
  providers: [CommentDataloaderService, HasCommentResolver],
  exports: [CommentDataloaderService]
})
export class CommentModule {}
