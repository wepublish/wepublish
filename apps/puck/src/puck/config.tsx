import { BreakConfig } from './components/break.config';
import {
  FacebookConfig,
  FacebookVideoConfig,
  InstagramConfig,
} from './components/facebook.config';
import { HtmlConfig } from './components/html.config';
import { IFrameConfig } from './components/iframe.config';
import { ListicleConfig } from './components/listicle.config';
import { QuoteConfig } from './components/quote.config';
import { RichTextConfig } from './components/richtext.config';
import { Space } from './components/space';
import { SubscribeConfig } from './components/subscribe.config';
import { TikTokConfig } from './components/tiktok.config';
import { TitleConfig } from './components/title.config';
import { VimeoConfig } from './components/vimeo.config';
import { YouTubeConfig } from './components/youtube.config';
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
    Title: TitleConfig,
    Quote: QuoteConfig,
    Html: HtmlConfig,
    Break: BreakConfig,
    Space,
    RichText: RichTextConfig,
    Listicle: ListicleConfig,
    IFrame: IFrameConfig,
    YouTube: YouTubeConfig,
    Vimeo: VimeoConfig,
    TikTok: TikTokConfig,
    FacebookVideo: FacebookVideoConfig,
    Facebook: FacebookConfig,
    Instagram: InstagramConfig,
    Subscribe: SubscribeConfig,
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText', 'Subscribe'],
    },
    blocks: {
      components: ['Title', 'Quote', 'Html', 'Break'],
      defaultExpanded: false,
    },
    layout: {
      components: ['Space'],
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
      ],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};
