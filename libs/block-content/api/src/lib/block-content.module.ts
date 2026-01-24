import { forwardRef, Module } from '@nestjs/common';
import { BlockStylesModule } from './block-styles/block-styles.module';
import { EventBlockResolver } from './event/event-block.resolver';
import { CommentBlockResolver } from './comment/comment-block.resolver';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { CommentModule } from '@wepublish/comments/api';
import { EventModule } from '@wepublish/event/api';
import { PeerModule } from '@wepublish/peering/api';
import { ArticleModule } from '@wepublish/article/api';
import { PageModule } from '@wepublish/page/api';
import {
  TeaserListBlockFilterResolver,
  TeaserListBlockResolver,
} from './teaser/teaser-list.resolver';
import { BaseBlockResolver } from './base-block.resolver';
import { SlotTeasersLoader } from './teaser/slot-teasers-loader';
import { TagModule } from '@wepublish/tag/api';
import { SubscribeBlockResolver } from './subscribe/subscribe-block.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';

@Module({
  imports: [
    PrismaModule,
    BlockStylesModule,
    ImageModule,
    forwardRef(() => ArticleModule),
    forwardRef(() => PageModule),
    EventModule,
    PeerModule,
    CommentModule,
    TagModule,
    forwardRef(() => MemberPlanModule),
  ],
  providers: [
    BaseBlockResolver,
    EventBlockResolver,
    CommentBlockResolver,
    TeaserListBlockResolver,
    TeaserListBlockFilterResolver,
    SlotTeasersLoader,
    SubscribeBlockResolver,
  ],
  exports: [SlotTeasersLoader],
})
export class BlockContentModule {}
