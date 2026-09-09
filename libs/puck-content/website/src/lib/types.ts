import { Config } from '@puckeditor/core';
import {
  BuilderBildwurfAdBlockProps,
  BuilderBreakBlockProps,
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderEventBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderImageBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderListicleBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderPollBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
} from '@wepublish/website/builder';

import { ContainerProps } from './components/layout/container.component';
import { DynamicGridProps } from './components/layout/dynamic-grid.component';
import { GridProps } from './components/layout/grid.component';
import { RowProps } from './components/layout/row.component';
import { SliderProps } from './components/layout/slider.component';
import { SpaceProps } from './components/layout/space.component';
import { WithVisibility } from './components/layout/with-visibility';
import { MailchimpFormConfigProps } from './components/data/mailchimp-form.component';
import { SubscribeConfigProps } from './components/subscribe.component';
import { WithDataSource } from './components/with-datasource';
import {
  AlignmentValue,
  SEOValue,
  UserFields,
} from '@wepublish/puck-content/editor';

export type RootProps = {
  showNavigation: boolean;
  showFooter: boolean;
  seo?: SEOValue;
  socialMedia?: SEOValue;
};

type BaseComponents = {
  Title: BuilderTitleBlockProps;
  Quote: BuilderQuoteBlockProps;
  Html: BuilderHTMLBlockProps;
  Break: BuilderBreakBlockProps;
  Space: SpaceProps;
  Grid: WithDataSource<GridProps>;
  DynamicGrid: WithDataSource<DynamicGridProps>;
  Row: WithDataSource<RowProps>;
  Slider: WithDataSource<SliderProps>;
  Container: WithDataSource<ContainerProps>;
  RichText: BuilderRichTextBlockProps;
  Listicle: BuilderListicleBlockProps;
  IFrame: BuilderIFrameBlockProps;
  YouTube: BuilderYouTubeVideoBlockProps;
  Vimeo: BuilderVimeoVideoBlockProps;
  TikTok: BuilderTikTokVideoBlockProps;
  FacebookVideo: BuilderFacebookVideoBlockProps;
  Facebook: BuilderFacebookPostBlockProps;
  Instagram: BuilderInstagramPostBlockProps;
  Subscribe: SubscribeConfigProps;
  Image: BuilderImageBlockProps;
  Button: { text: string; alignment?: AlignmentValue };
  Twitter: BuilderTwitterTweetBlockProps;
  SoundCloud: BuilderSoundCloudTrackBlockProps;
  Streamable: BuilderStreamableVideoBlockProps;
  Polis: BuilderPolisConversationBlockProps;
  BildwurfAd: BuilderBildwurfAdBlockProps;
  MailchimpForm: MailchimpFormConfigProps;
  Comment: BuilderCommentBlockProps;
  Event: BuilderEventBlockProps;
  Crowdfunding: BuilderCrowdfundingBlockProps;
  Poll: BuilderPollBlockProps;
};

export type Components = {
  [K in keyof BaseComponents]: WithVisibility<BaseComponents[K]>;
};

export type { UserFields };

export type UserConfig = Config<{
  components: Components;
  fields: UserFields;
  root: RootProps;
  categories: ['recommended', 'content', 'layout', 'embed'];
}>;
