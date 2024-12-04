import {forwardRef, Module} from '@nestjs/common'
import {BlockStylesModule} from './block-styles/block-styles.module'
import {PollBlockResolver} from './poll/poll-block.resolver'
import {EventBlockResolver} from './event/event-block.resolver'
import {CommentBlockResolver} from './comment/comment-block.resolver'
import {ImageModule} from '@wepublish/image/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {CommentModule} from '@wepublish/comments/api'
import {EventModule} from '@wepublish/event/api'
import {PeerModule} from '@wepublish/peering/api'
import {ArticleModule} from '@wepublish/article/api'
import {PageModule} from '@wepublish/page/api'
import {TeaserListBlockResolver} from './teaser/teaser-list.resolver'

@Module({
  imports: [
    PrismaModule,
    BlockStylesModule,
    ImageModule,
    forwardRef(() => ArticleModule),
    forwardRef(() => PageModule),
    PageModule,
    EventModule,
    PeerModule,
    CommentModule
  ],
  providers: [PollBlockResolver, EventBlockResolver, CommentBlockResolver, TeaserListBlockResolver]
})
export class BlockContentModule {}
