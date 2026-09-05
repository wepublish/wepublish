import { Config } from '@puckeditor/core';
import {
  BuilderBreakBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderListicleBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
} from '@wepublish/website/builder';

import { ContainerProps } from './components/layout/container';
import { FlexProps } from './components/layout/flex';
import { GridProps } from './components/layout/grid';
import { SpaceProps } from './components/layout/space';
import { WithColumnSpan } from './components/layout/with-column-span';
import { SubscribeConfigProps } from './components/subscribe.config';
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
  Flex: WithDataSource<FlexProps>;
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
  Button: { text: string; alignment?: AlignmentValue };
};

export type Components = {
  [K in keyof BaseComponents]: WithColumnSpan<BaseComponents[K]>;
};

export type { UserFields };

export type UserConfig = Config<{
  components: Components;
  fields: UserFields;
  root: RootProps;
  categories: ['recommended', 'content', 'layout', 'embed'];
}>;
