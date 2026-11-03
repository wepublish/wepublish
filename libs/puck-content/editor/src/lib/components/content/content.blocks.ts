import { withCSS } from '../../blocks/with-css';
import { withVisibility } from '../../blocks/with-visibility';
import { textlessStylingGroups } from '../../styling/styling.field';
import { PuckDerivedDatasources } from '../../config.types';
import { DatasourcesValue } from '../../datasource/datasource.field';
import {
  contentDatasourceFieldTabs,
  FieldTabsLayout,
} from '../../field-tabs/field-tabs';
import { BreakConfig } from '../break/break.config';
import { BildwurfAdConfig } from '../embed/bildwurf-ad/bildwurf-ad.config';
import {
  FacebookConfig,
  FacebookVideoConfig,
  InstagramConfig,
} from '../embed/facebook/facebook.config';
import { HtmlConfig } from '../embed/html/html.config';
import { IFrameConfig } from '../embed/iframe/iframe.config';
import { PolisConfig } from '../embed/polis/polis.config';
import { SoundCloudConfig } from '../embed/sound-cloud/sound-cloud.config';
import { StreamableConfig } from '../embed/streamable/streamable.config';
import { TikTokConfig } from '../embed/tiktok/tiktok.config';
import { TwitterConfig } from '../embed/twitter/twitter.config';
import { VimeoConfig } from '../embed/vimeo/vimeo.config';
import { YouTubeConfig } from '../embed/youtube/youtube.config';
import { ButtonConfig } from './button/button.config';
import { ImageConfig } from './image/image.config';
import { LightboxConfig } from './lightbox/lightbox.config';
import { ListicleConfig } from './listicle/listicle.config';
import { QuoteConfig } from './quote/quote.config';
import { RichTextConfig } from './richtext/richtext.config';
import { TitleConfig } from './title/title.config';

export const contentComponents = {
  Title: withVisibility(
    withCSS(TitleConfig, { groups: textlessStylingGroups })
  ),
  Quote: withVisibility(withCSS(QuoteConfig)),
  Html: withVisibility(withCSS(HtmlConfig)),
  Break: withVisibility(withCSS(BreakConfig)),
  RichText: withVisibility(
    withCSS(RichTextConfig, { groups: textlessStylingGroups })
  ),
  Listicle: withVisibility(withCSS(ListicleConfig)),
  IFrame: withVisibility(withCSS(IFrameConfig)),
  YouTube: withVisibility(withCSS(YouTubeConfig)),
  Vimeo: withVisibility(withCSS(VimeoConfig)),
  TikTok: withVisibility(withCSS(TikTokConfig)),
  FacebookVideo: withVisibility(withCSS(FacebookVideoConfig)),
  Facebook: withVisibility(withCSS(FacebookConfig)),
  Instagram: withVisibility(withCSS(InstagramConfig)),
  Button: withVisibility(withCSS(ButtonConfig)),
  Image: withVisibility(withCSS(ImageConfig)),
  Lightbox: withVisibility(withCSS(LightboxConfig)),
  Twitter: withVisibility(withCSS(TwitterConfig)),
  SoundCloud: withVisibility(withCSS(SoundCloudConfig)),
  Streamable: withVisibility(withCSS(StreamableConfig)),
  Polis: withVisibility(withCSS(PolisConfig)),
  BildwurfAd: withVisibility(withCSS(BildwurfAdConfig)),
};

export const contentFieldTabs: Partial<
  Record<keyof typeof contentComponents, FieldTabsLayout>
> = {
  Image: contentDatasourceFieldTabs,
  Quote: contentDatasourceFieldTabs,
  Break: contentDatasourceFieldTabs,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickedImageIds = (items: unknown): string[] => [
  ...new Set(
    (Array.isArray(items) ? items : []).flatMap(item =>
      isRecord(item) && typeof item.imageId === 'string' && item.imageId ?
        [item.imageId]
      : []
    )
  ),
];

const pickedImages = (items: unknown): DatasourcesValue => ({
  image: { type: 'multiple', ids: pickedImageIds(items) },
});

export const contentDerivedDatasources: PuckDerivedDatasources = {
  Lightbox: props => pickedImages(props.images),
  Listicle: props => pickedImages(props.items),
};

export * from '../break/break.config';
export * from '../embed/bildwurf-ad/bildwurf-ad.config';
export * from '../embed/facebook/facebook.config';
export * from '../embed/html/html.config';
export * from '../embed/iframe/iframe.config';
export * from '../embed/polis/polis.config';
export * from '../embed/sound-cloud/sound-cloud.config';
export * from '../embed/streamable/streamable.config';
export * from '../embed/tiktok/tiktok.config';
export * from '../embed/twitter/twitter.config';
export * from '../embed/vimeo/vimeo.config';
export * from '../embed/youtube/youtube.config';
export * from '../placeholder-richtext';
export * from './button/button.config';
export * from './image/image.config';
export * from './lightbox/lightbox.config';
export * from './listicle/listicle.config';
export * from './quote/quote.config';
export * from './richtext/richtext.config';
export * from './title/title.config';
