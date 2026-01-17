import { Config, Data, Overrides } from '@puckeditor/core';
import { RootProps } from './root';
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
import { TeaserItemProps } from './components/teaser.render';
import { EventConfigProps } from './components/event.config';
import { ComponentProps } from 'react';
import { TextField } from '@wepublish/ui';
import { GridProps } from './components/grid.config';
import { SpaceProps } from './components/space';
import { SubscribeConfigProps } from './components/subscribe.config';
import { TeaserListProps } from './components/teaser-list.render';

declare module '@puckeditor/core' {
  interface TextField {
    metadata?: ComponentProps<typeof TextField>;
  }
}

export type Components = {
  Title: BuilderTitleBlockProps;
  Quote: BuilderQuoteBlockProps;
  Html: BuilderHTMLBlockProps;
  Break: BuilderBreakBlockProps;
  Teaser: TeaserItemProps;
  RichText: BuilderRichTextBlockProps;
  Listicle: BuilderListicleBlockProps;
  Event: EventConfigProps;
  IFrame: BuilderIFrameBlockProps;
  YouTube: BuilderYouTubeVideoBlockProps;
  Vimeo: BuilderVimeoVideoBlockProps;
  TikTok: BuilderTikTokVideoBlockProps;
  FacebookVideo: BuilderFacebookVideoBlockProps;
  Facebook: BuilderFacebookPostBlockProps;
  Instagram: BuilderInstagramPostBlockProps;
  Subscribe: SubscribeConfigProps;
  TeaserList: TeaserListProps;
  Space: SpaceProps;
  Grid: GridProps;
};

export type UserConfig = Config<{
  components: Components;
  root: RootProps;
  categories: ['recommended', 'blocks', 'layout', 'embed'];
}>;

export type UserOverride = Partial<Overrides<UserConfig>>;

export type UserData = Data<Components, RootProps>;
