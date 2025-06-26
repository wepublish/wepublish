import {Module} from '@nestjs/common'
import {CommentDataloaderService} from './comment-dataloader.service'
import {HasCommentResolver, HasOptionalCommentResolver} from './has-comment/has-comment.resolver'
import {CommentService} from './comment.service'
import {CommentResolver} from './comment.resolver'
import {PrismaModule, URLAdapterModule} from '@wepublish/nest-modules'
import {TagModule} from '@wepublish/tag/api'
import {RatingSystemResolver, RatingSystemService} from './rating-system'
import {SettingModule} from '@wepublish/settings/api'
import {ImageModule} from '@wepublish/image/api'
import {UserModule} from '@wepublish/user/api'

@Module({
  imports: [PrismaModule, TagModule, SettingModule, URLAdapterModule, ImageModule, UserModule],
  providers: [
    CommentDataloaderService,
    HasCommentResolver,
    HasOptionalCommentResolver,
    RatingSystemService,
    CommentResolver,
    RatingSystemResolver,
    CommentService
  ],
  exports: [CommentDataloaderService, CommentService, RatingSystemService]
})
export class CommentModule {}
