import {forwardRef, Module} from '@nestjs/common'
import {BlockStylesModule} from './block-styles/block-styles.module'
import {PollBlockResolver} from './poll/poll-block.resolver'
import {EventBlockResolver} from './event/event-block.resolver'
import {CommentBlockResolver} from './comment/comment-block.resolver'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {CommentModule} from '@wepublish/comments/api'
import {PageModule} from '@wepublish/page/api'
import {EventModule} from '@wepublish/event/api'
import {PeerModule} from '@wepublish/peering/api'
// Intended, we use forwardRef below
// eslint-disable-next-line @nx/enforce-module-boundaries
import {ArticleModule} from '@wepublish/article/api'

@Module({
  imports: [
    PrismaModule,
    BlockStylesModule,
    ImageModule,
    forwardRef(() => ArticleModule),
    PageModule,
    EventModule,
    PeerModule,
    CommentModule
  ],
  providers: [PollBlockResolver, EventBlockResolver, CommentBlockResolver]
})
export class BlockContentModule {}
