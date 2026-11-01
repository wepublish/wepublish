import { withCSS } from '../../blocks/with-css';
import {
  DatasourceSettings,
  withDataSource,
} from '../../blocks/with-datasource';
import { withVisibility } from '../../blocks/with-visibility';
import { PuckBlockConsumes } from '../../config.types';
import { DatasourcesValue } from '../../datasource/datasource.field';
import { TeaserConfig } from '../teaser/teaser/teaser.config';
import { TeaserAuthorsConfig } from '../teaser/teaser-authors/teaser-authors.config';
import { TeaserDateConfig } from '../teaser/teaser-date/teaser-date.config';
import { TeaserImageConfig } from '../teaser/teaser-image/teaser-image.config';
import { TeaserLeadConfig } from '../teaser/teaser-lead/teaser-lead.config';
import { TeaserPreTitleConfig } from '../teaser/teaser-pre-title/teaser-pre-title.config';
import { TeaserTagsConfig } from '../teaser/teaser-tags/teaser-tags.config';
import { TeaserTitleConfig } from '../teaser/teaser-title/teaser-title.config';
import { CommentConfig } from './comment/comment.config';
import { CrowdfundingConfig } from './crowdfunding/crowdfunding.config';
import { EventConfig, eventConsumes } from './event/event.config';
import { PollConfig } from './poll/poll.config';

const teaserDatasource: DatasourceSettings = {
  models: ['article', 'page', 'event'],
  types: ['slot', 'single'],
};

const teaserDefaultDatasources: DatasourcesValue = {
  article: { type: 'slot' },
};

export const dataComponents = {
  Comment: withVisibility(CommentConfig),
  Event: withVisibility(EventConfig),
  Crowdfunding: withVisibility(CrowdfundingConfig),
  Poll: withVisibility(PollConfig),
  Teaser: withVisibility(
    withDataSource(
      withCSS(TeaserConfig),
      teaserDefaultDatasources,
      teaserDatasource
    )
  ),
  TeaserTitle: withVisibility(TeaserTitleConfig),
  TeaserPreTitle: withVisibility(TeaserPreTitleConfig),
  TeaserLead: withVisibility(TeaserLeadConfig),
  TeaserImage: withVisibility(TeaserImageConfig),
  TeaserAuthors: withVisibility(TeaserAuthorsConfig),
  TeaserDate: withVisibility(TeaserDateConfig),
  TeaserTags: withVisibility(TeaserTagsConfig),
};

export const dataBlockConsumes: PuckBlockConsumes = {
  Event: eventConsumes,
};

export * from '../teaser/teaser-authors/teaser-authors.config';
export * from '../teaser/teaser-date/teaser-date.config';
export * from '../teaser/teaser-image/teaser-image.config';
export * from '../teaser/teaser-lead/teaser-lead.config';
export * from '../teaser/teaser-pre-title/teaser-pre-title.config';
export * from '../teaser/teaser-tags/teaser-tags.config';
export * from '../teaser/teaser-title/teaser-title.config';
export * from '../teaser/teaser/teaser-editor.component';
export * from '../teaser/teaser/teaser.config';
export * from './comment/comment.config';
export * from './crowdfunding/crowdfunding.config';
export * from './event/event.config';
export * from './poll/poll.config';
