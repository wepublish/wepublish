import {
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderPollBlockProps,
} from '@wepublish/website/builder';

import { PuckBlockDefinition } from '../../blocks/block.types';
import { TeaserAuthorsConfigProps } from '../teaser/teaser-authors/teaser-authors.component';
import { TeaserDateConfigProps } from '../teaser/teaser-date/teaser-date.component';
import { TeaserImageConfigProps } from '../teaser/teaser-image/teaser-image.component';
import { TeaserLeadConfigProps } from '../teaser/teaser-lead/teaser-lead.component';
import { TeaserPreTitleConfigProps } from '../teaser/teaser-pre-title/teaser-pre-title.component';
import { TeaserTagsConfigProps } from '../teaser/teaser-tags/teaser-tags.component';
import { TeaserTitleConfigProps } from '../teaser/teaser-title/teaser-title.component';
import {
  TeaserAuthorsRender,
  TeaserDateRender,
  TeaserImageRender,
  TeaserLeadRender,
  TeaserPreTitleRender,
  TeaserTagsRender,
  TeaserTitleRender,
} from '../teaser/teaser.render';
import { CommentRender } from './comment/comment.render';
import { CrowdfundingRender } from './crowdfunding/crowdfunding.render';
import { EventConfigProps, EventRender } from './event/event.component';
import { PollRender } from './poll/poll.component';

export type DataBlockProps = {
  Comment: BuilderCommentBlockProps;
  Crowdfunding: BuilderCrowdfundingBlockProps;
  Poll: BuilderPollBlockProps;
  Event: EventConfigProps;
  TeaserTitle: Omit<TeaserTitleConfigProps, 'className'>;
  TeaserPreTitle: Omit<TeaserPreTitleConfigProps, 'className'>;
  TeaserLead: Omit<TeaserLeadConfigProps, 'className'>;
  TeaserImage: Omit<TeaserImageConfigProps, 'className'>;
  TeaserAuthors: Omit<TeaserAuthorsConfigProps, 'className'>;
  TeaserDate: Omit<TeaserDateConfigProps, 'className'>;
  TeaserTags: Omit<TeaserTagsConfigProps, 'className'>;
};

export const dataBlockRegistry: {
  [Type in keyof DataBlockProps]: PuckBlockDefinition<DataBlockProps[Type]>;
} = {
  Comment: { component: CommentRender },
  Crowdfunding: { component: CrowdfundingRender },
  Poll: { component: PollRender },
  Event: { component: EventRender },
  TeaserTitle: { component: TeaserTitleRender },
  TeaserPreTitle: { component: TeaserPreTitleRender },
  TeaserLead: { component: TeaserLeadRender },
  TeaserImage: { component: TeaserImageRender },
  TeaserAuthors: { component: TeaserAuthorsRender },
  TeaserDate: { component: TeaserDateRender },
  TeaserTags: { component: TeaserTagsRender },
};

export * from '../teaser/teaser-authors/teaser-authors.component';
export * from '../teaser/teaser-date/teaser-date.component';
export * from '../teaser/teaser-image/teaser-image.component';
export * from '../teaser/teaser-lead/teaser-lead.component';
export * from '../teaser/teaser-pre-title/teaser-pre-title.component';
export * from '../teaser/teaser-tags/teaser-tags.component';
export * from '../teaser/teaser-title/teaser-title.component';
export * from '../teaser/teaser.render';
export * from './comment/comment.render';
export * from './crowdfunding/crowdfunding.render';
export * from './event/event.component';
export * from './poll/poll.component';
