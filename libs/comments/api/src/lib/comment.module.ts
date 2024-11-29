import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {CommentDataloaderService} from './comment-dataloader.service'

@Module({
  imports: [PrismaModule],
  providers: [CommentDataloaderService],
  exports: [CommentDataloaderService]
})
export class CommentModule {}
