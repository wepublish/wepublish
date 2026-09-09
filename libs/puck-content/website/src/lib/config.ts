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
import { BildwurfAdConfig } from './components/embed/bildwurf-ad.config';
import { PolisConfig } from './components/embed/polis.config';
import { SoundCloudConfig } from './components/embed/sound-cloud.config';
import { StreamableConfig } from './components/embed/streamable.config';
import { TwitterConfig } from './components/embed/twitter.config';
import { CommentConfig } from './components/data/comment.config';
import { CrowdfundingConfig } from './components/data/crowdfunding.config';
import { EventConfig } from './components/data/event.config';
import { MailchimpFormConfig } from './components/data/mailchimp-form.config';
import { PollConfig } from './components/data/poll.config';
import { ContainerConfig } from './components/layout/container.config';
import { DynamicGrid } from './components/layout/dynamic-grid.config';
import { Grid } from './components/layout/grid.config';
import { Row } from './components/layout/row.config';
import { Slider } from './components/layout/slider.config';
import { Space } from './components/layout/space.config';
import { withCSS } from './components/layout/with-css';
import { withVisibility } from './components/layout/with-visibility';
import { SubscribeConfig } from './components/subscribe.config';
import { withDataSource } from './components/with-datasource';
import { seoField, switchFieldAi } from '@wepublish/puck-content/editor';
import { Root } from './root.component';
import { UserConfig } from './types';
import { ImageConfig } from './components/content/image.config';

export const config: UserConfig = {
  root: {
    fields: {
      showNavigation: {
        type: 'switch',
        label: 'Show Navbar',
        ai: switchFieldAi(
          'Whether the website navigation bar is shown above the page content.'
        ),
      },
      showFooter: {
        type: 'switch',
        label: 'Show Footer',
        ai: switchFieldAi(
          'Whether the website footer is shown below the page content.'
        ),
      },
      seo: seoField({
        label: 'SEO',
        instructions: 'Metadata shown to search engines.',
      }),
      socialMedia: seoField({
        label: 'Social Media',
        instructions: 'Metadata shown when the page is shared on social media.',
      }),
    },
    defaultProps: {
      showFooter: true,
      showNavigation: true,
    },
    render: Root,
  },
  components: {
    Title: withVisibility(TitleConfig),
    Quote: withVisibility(QuoteConfig),
    Html: withVisibility(HtmlConfig),
    Break: withVisibility(BreakConfig),
    Space: withVisibility(Space),
    Grid: withVisibility(
      withDataSource(withCSS(Grid), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    DynamicGrid: withVisibility(
      withDataSource(withCSS(DynamicGrid), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    Row: withVisibility(
      withDataSource(withCSS(Row), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    Slider: withVisibility(
      withDataSource(withCSS(Slider), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    Container: withVisibility(
      withDataSource(withCSS(ContainerConfig), undefined, {
        types: ['autofill', 'list', 'items'],
      })
    ),
    RichText: withVisibility(RichTextConfig),
    Listicle: withVisibility(ListicleConfig),
    IFrame: withVisibility(IFrameConfig),
    YouTube: withVisibility(YouTubeConfig),
    Vimeo: withVisibility(VimeoConfig),
    TikTok: withVisibility(TikTokConfig),
    FacebookVideo: withVisibility(FacebookVideoConfig),
    Facebook: withVisibility(FacebookConfig),
    Instagram: withVisibility(InstagramConfig),
    Subscribe: withVisibility(SubscribeConfig),
    Button: withVisibility(ButtonConfig),
    Image: withVisibility(ImageConfig),
    Twitter: withVisibility(TwitterConfig),
    SoundCloud: withVisibility(SoundCloudConfig),
    Streamable: withVisibility(StreamableConfig),
    Polis: withVisibility(PolisConfig),
    BildwurfAd: withVisibility(BildwurfAdConfig),
    MailchimpForm: withVisibility(MailchimpFormConfig),
    Comment: withVisibility(CommentConfig),
    Event: withVisibility(EventConfig),
    Crowdfunding: withVisibility(CrowdfundingConfig),
    Poll: withVisibility(PollConfig),
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText', 'Subscribe'],
    },
    content: {
      components: ['Title', 'Quote', 'RichText', 'Image'],
      defaultExpanded: false,
    },
    layout: {
      components: [
        'Space',
        'Grid',
        'DynamicGrid',
        'Row',
        'Slider',
        'Container',
      ],
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
        'Twitter',
        'SoundCloud',
        'Streamable',
        'Polis',
        'Html',
      ],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};
