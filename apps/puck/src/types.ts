import { Config, Data, Overrides } from '@measured/puck';
import { RootProps } from './root';
import {
  BuilderBreakBlockProps,
  BuilderHTMLBlockProps,
  BuilderListicleBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderTitleBlockProps,
} from '@wepublish/website/builder';
import { TeaserItemProps } from './components/teaser.render';
import { EventConfigProps } from './components/event.config';
import { ComponentProps } from 'react';
import { TextField } from '@wepublish/ui';

declare module '@measured/puck' {
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
  Space: any;
  Grid: any;
};

export type UserConfig = Config<{
  components: Components;
  root: RootProps;
  categories: ['recommended', 'blocks', 'layout'];
}>;

export type UserOverride = Partial<Overrides<UserConfig>>;

export type UserData = Data<Components, RootProps>;
