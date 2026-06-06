import { Config } from '@puckeditor/core';
import { TextField } from '@wepublish/ui';
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
import { ComponentProps } from 'react';

import { SpaceProps } from './components/space';
import { SubscribeConfigProps } from './components/subscribe.config';
import { BorderField } from './plugins/border';
import { ColumnsField } from './plugins/columns';
import { DatasourceField } from './plugins/datasource';
import { PaddingField } from './plugins/padding';
import { SEOField, SEOValue } from './plugins/seo';

declare module '@puckeditor/core' {
  interface TextField {
    metadata?: ComponentProps<typeof TextField>;
  }
}

export type RootProps = {
  showNavigation: boolean;
  showFooter: boolean;
  seo?: SEOValue;
  socialMedia?: SEOValue;
};

export type Components = {
  Title: BuilderTitleBlockProps;
  Quote: BuilderQuoteBlockProps;
  Html: BuilderHTMLBlockProps;
  Break: BuilderBreakBlockProps;
  Space: SpaceProps;
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
};

export type UserFields = {
  datasource: DatasourceField;
  seo: SEOField;
  padding: PaddingField;
  border: BorderField;
  columns: ColumnsField;
};

export type UserConfig = Config<{
  components: Components;
  fields: UserFields;
  root: RootProps;
  categories: ['recommended', 'blocks', 'layout', 'embed'];
}>;
