import { BreakConfig } from './components/break.config';
import { ButtonConfig } from './components/content/button.config';
import { ListicleConfig } from './components/content/listicle.config';
import { QuoteConfig } from './components/content/quote.config';
import { RichTextConfig } from './components/content/richtext.config';
import { TitleConfig } from './components/content/title.config';
import {
  FacebookConfig,
  FacebookVideoConfig,
  InstagramConfig,
} from './components/embed/facebook.config';
import { HtmlConfig } from './components/embed/html.config';
import { IFrameConfig } from './components/embed/iframe.config';
import { TikTokConfig } from './components/embed/tiktok.config';
import { VimeoConfig } from './components/embed/vimeo.config';
import { YouTubeConfig } from './components/embed/youtube.config';
import { ContainerConfig } from './components/layout/container';
import { Flex } from './components/layout/flex';
import { Grid } from './components/layout/grid';
import { Space } from './components/layout/space';
import { withColumnSpan } from './components/layout/with-column-span';
import { withCSS } from './components/layout/with-css';
import { SubscribeConfig } from './components/subscribe.config';
import { withDataSource } from './components/with-datasource';
import { RootRender } from './root.component';
import { UserConfig } from './types';

export const config: UserConfig = {
  root: {
    fields: {
      showNavigation: {
        type: 'radio',
        options: [
          { label: 'Show', value: true },
          { label: 'Hide', value: false },
        ],
        label: 'Navbar',
      },
      showFooter: {
        type: 'radio',
        options: [
          { label: 'Show', value: true },
          { label: 'Hide', value: false },
        ],
        label: 'Footer',
      },
      seo: {
        type: 'seo',
      },
      socialMedia: {
        type: 'seo',
      },
    },
    defaultProps: {
      showFooter: true,
      showNavigation: true,
    },
    render: ({ puck: { renderDropZone }, showFooter, showNavigation }) => (
      <RootRender
        DropZone={renderDropZone}
        showFooter={showFooter}
        showNavigation={showNavigation}
      />
    ),
  },
  components: {
    Title: withColumnSpan(TitleConfig),
    Quote: withColumnSpan(QuoteConfig),
    Html: withColumnSpan(HtmlConfig),
    Break: withColumnSpan(BreakConfig),
    Space: withColumnSpan(Space),
    Grid: withColumnSpan(
      withDataSource(withCSS(Grid), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    Flex: withColumnSpan(
      withDataSource(withCSS(Flex), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    Container: withColumnSpan(
      withDataSource(withCSS(ContainerConfig), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    RichText: withColumnSpan(RichTextConfig),
    Listicle: withColumnSpan(ListicleConfig),
    IFrame: withColumnSpan(IFrameConfig),
    YouTube: withColumnSpan(YouTubeConfig),
    Vimeo: withColumnSpan(VimeoConfig),
    TikTok: withColumnSpan(TikTokConfig),
    FacebookVideo: withColumnSpan(FacebookVideoConfig),
    Facebook: withColumnSpan(FacebookConfig),
    Instagram: withColumnSpan(InstagramConfig),
    Subscribe: withColumnSpan(SubscribeConfig),
    Button: withColumnSpan(ButtonConfig),
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText', 'Subscribe'],
    },
    content: {
      components: ['Title', 'Quote', 'RichText'],
      defaultExpanded: false,
    },
    layout: {
      components: ['Space', 'Grid', 'Flex', 'Container'],
      defaultExpanded: false,
    },
    embed: {
      components: [
        'IFrame',
        'YouTube',
        'FacebookVideo',
        'Facebook',
        'Instagram',
        'TikTok',
        'Vimeo',
        'Html',
      ],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};
