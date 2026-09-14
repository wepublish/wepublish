import { BreakConfig } from './components/break/break.config';
import { ButtonConfig } from './components/content/button/button.config';
import { ListicleConfig } from './components/content/listicle/listicle.config';
import { QuoteConfig } from './components/content/quote/quote.config';
import { RichTextConfig } from './components/content/richtext/richtext.config';
import { TitleConfig } from './components/content/title/title.config';
import {
  FacebookConfig,
  FacebookVideoConfig,
  InstagramConfig,
} from './components/embed/facebook/facebook.config';
import { HtmlConfig } from './components/embed/html/html.config';
import { IFrameConfig } from './components/embed/iframe/iframe.config';
import { TikTokConfig } from './components/embed/tiktok/tiktok.config';
import { VimeoConfig } from './components/embed/vimeo/vimeo.config';
import { YouTubeConfig } from './components/embed/youtube/youtube.config';
import { BildwurfAdConfig } from './components/embed/bildwurf-ad/bildwurf-ad.config';
import { PolisConfig } from './components/embed/polis/polis.config';
import { SoundCloudConfig } from './components/embed/sound-cloud/sound-cloud.config';
import { StreamableConfig } from './components/embed/streamable/streamable.config';
import { TwitterConfig } from './components/embed/twitter/twitter.config';
import { CommentConfig } from './components/data/comment/comment.config';
import { CrowdfundingConfig } from './components/data/crowdfunding/crowdfunding.config';
import { EventConfig } from './components/data/event/event.config';
import { MailchimpFormConfig } from './components/data/mailchimp-form/mailchimp-form.config';
import { PollConfig } from './components/data/poll/poll.config';
import { CollapsibleConfig } from './components/layout/collapsible/collapsible.config';
import { ContainerConfig } from './components/layout/container/container.config';
import { DynamicGrid } from './components/layout/dynamic-grid/dynamic-grid.config';
import { Grid } from './components/layout/grid/grid.config';
import { Row } from './components/layout/row/row.config';
import { Slider } from './components/layout/slider/slider.config';
import { Space } from './components/layout/space/space.config';
import { withCSS } from './components/layout/with-css';
import { withVisibility } from './components/layout/with-visibility';
import { SubscribeConfig } from './components/subscribe/subscribe.config';
import { withDataSource } from './components/with-datasource';
import { seoField, switchFieldAi } from '@wepublish/puck-content/editor';
import { Root } from './root.component';
import { UserConfig } from './types';
import { ImageConfig } from './components/content/image/image.config';
import { LightboxConfig } from './components/content/lightbox/lightbox.config';
import { TeaserAuthorsConfig } from './components/teaser/teaser-authors/teaser-authors.config';
import { TeaserDateConfig } from './components/teaser/teaser-date/teaser-date.config';
import { TeaserImageConfig } from './components/teaser/teaser-image/teaser-image.config';
import { TeaserLeadConfig } from './components/teaser/teaser-lead/teaser-lead.config';
import { TeaserPreTitleConfig } from './components/teaser/teaser-pre-title/teaser-pre-title.config';
import { TeaserTagsConfig } from './components/teaser/teaser-tags/teaser-tags.config';
import { TeaserTitleConfig } from './components/teaser/teaser-title/teaser-title.config';

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
    Collapsible: withVisibility(withCSS(CollapsibleConfig)),
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
    Lightbox: withVisibility(LightboxConfig),
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
    TeaserTitle: withVisibility(TeaserTitleConfig),
    TeaserPreTitle: withVisibility(TeaserPreTitleConfig),
    TeaserLead: withVisibility(TeaserLeadConfig),
    TeaserImage: withVisibility(TeaserImageConfig),
    TeaserAuthors: withVisibility(TeaserAuthorsConfig),
    TeaserDate: withVisibility(TeaserDateConfig),
    TeaserTags: withVisibility(TeaserTagsConfig),
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText', 'Subscribe'],
    },
    content: {
      components: ['Title', 'Quote', 'RichText', 'Image', 'Lightbox'],
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
        'Collapsible',
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
    teaser: {
      title: 'Teaser',
      components: [
        'TeaserTitle',
        'TeaserPreTitle',
        'TeaserLead',
        'TeaserImage',
        'TeaserAuthors',
        'TeaserDate',
        'TeaserTags',
      ],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};
