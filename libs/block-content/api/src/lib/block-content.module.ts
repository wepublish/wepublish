import { forwardRef, Module } from '@nestjs/common';
import { BlockStylesModule } from './block-styles/block-styles.module';
import { BlockTemplateModule } from './block-template/block-template.module';
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
import { BlockTimingResolver } from './timing/block-timing.resolver';
import { BlockTreeLoader } from './block-tree/block-tree-loader';
import { TagModule } from '@wepublish/tag/api';
import { SubscribeBlockResolver } from './subscribe/subscribe-block.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpSubscribeResolver } from './mailchimp-form/mailchimp-subscribe.resolver';
import { MailchimpSubscribeService } from './mailchimp-form/mailchimp-subscribe.service';
import { PuckBlockDataLoader } from './puck/puck-block-data.loader';
import { PuckBlockResolver } from './puck/puck-block.resolver';
import { PuckBlockStylingResolver } from './puck/puck-block-styling.resolver';
import { PuckBlocksPreviewResolver } from './puck/puck-blocks-preview.resolver';

@Module({
  imports: [
    PrismaModule,
    BlockStylesModule,
    forwardRef(() => BlockTemplateModule),
    ImageModule,
    forwardRef(() => ArticleModule),
    forwardRef(() => PageModule),
    EventModule,
    PeerModule,
    CommentModule,
    TagModule,
    forwardRef(() => MemberPlanModule),
    SettingModule,
  ],
  providers: [
    BaseBlockResolver,
    BlockTimingResolver,
    EventBlockResolver,
    CommentBlockResolver,
    TeaserListBlockResolver,
    TeaserListBlockFilterResolver,
    BlockTreeLoader,
    SubscribeBlockResolver,
    MailchimpSubscribeResolver,
    MailchimpSubscribeService,
    PuckBlockDataLoader,
    PuckBlockResolver,
    PuckBlockStylingResolver,
    PuckBlocksPreviewResolver,
  ],
  exports: [BlockTreeLoader, PuckBlockDataLoader],
})
export class BlockContentModule {}
