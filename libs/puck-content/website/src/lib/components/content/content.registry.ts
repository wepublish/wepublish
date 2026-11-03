import { PuckBlockDefinition } from '../../blocks/block.types';
import { BreakConfigProps, BreakRender } from '../break/break.component';
import {
  BildwurfAdConfigProps,
  BildwurfAdRender,
  FacebookConfigProps,
  FacebookRender,
  FacebookVideoConfigProps,
  FacebookVideoRender,
  HtmlConfigProps,
  HtmlRender,
  IFrameConfigProps,
  IFrameRender,
  InstagramConfigProps,
  InstagramRender,
  PolisConfigProps,
  PolisRender,
  SoundCloudConfigProps,
  SoundCloudRender,
  StreamableConfigProps,
  StreamableRender,
  TikTokConfigProps,
  TikTokRender,
  TwitterConfigProps,
  TwitterRender,
  VimeoConfigProps,
  VimeoRender,
  YouTubeConfigProps,
  YouTubeRender,
} from '../embed/embed.components';
import { ButtonConfigProps, ButtonRender } from './button/button.component';
import { ImageConfigProps, ImageRender } from './image/image.component';
import {
  LightboxConfigProps,
  LightboxRender,
} from './lightbox/lightbox.component';
import {
  ListicleConfigProps,
  ListicleRender,
} from './listicle/listicle.component';
import { QuoteConfigProps, QuoteRender } from './quote/quote.component';
import {
  RichTextConfigProps,
  RichTextRender,
} from './richtext/richtext.render';
import { TitleConfigProps, TitleRender } from './title/title.render';

export type ContentBlockProps = {
  Title: TitleConfigProps;
  Quote: QuoteConfigProps;
  Html: HtmlConfigProps;
  Break: BreakConfigProps;
  RichText: RichTextConfigProps;
  Listicle: ListicleConfigProps;
  IFrame: IFrameConfigProps;
  YouTube: YouTubeConfigProps;
  Vimeo: VimeoConfigProps;
  TikTok: TikTokConfigProps;
  FacebookVideo: FacebookVideoConfigProps;
  Facebook: FacebookConfigProps;
  Instagram: InstagramConfigProps;
  Button: ButtonConfigProps;
  Image: ImageConfigProps;
  Lightbox: LightboxConfigProps;
  Twitter: TwitterConfigProps;
  SoundCloud: SoundCloudConfigProps;
  Streamable: StreamableConfigProps;
  Polis: PolisConfigProps;
  BildwurfAd: BildwurfAdConfigProps;
};

export const contentBlockRegistry: {
  [Type in keyof ContentBlockProps]: PuckBlockDefinition<
    ContentBlockProps[Type]
  >;
} = {
  Title: { component: TitleRender },
  Quote: { component: QuoteRender },
  Html: { component: HtmlRender },
  Break: { component: BreakRender },
  RichText: { component: RichTextRender },
  Listicle: { component: ListicleRender },
  IFrame: { component: IFrameRender },
  YouTube: { component: YouTubeRender },
  Vimeo: { component: VimeoRender },
  TikTok: { component: TikTokRender },
  FacebookVideo: { component: FacebookVideoRender },
  Facebook: { component: FacebookRender },
  Instagram: { component: InstagramRender },
  Button: { component: ButtonRender },
  Image: { component: ImageRender },
  Lightbox: { component: LightboxRender },
  Twitter: { component: TwitterRender },
  SoundCloud: { component: SoundCloudRender },
  Streamable: { component: StreamableRender },
  Polis: { component: PolisRender },
  BildwurfAd: { component: BildwurfAdRender },
};

export * from '../break/break.component';
export * from '../embed/embed.components';
export * from './button/button.component';
export * from './data-images';
export * from './image/image.component';
export * from './lightbox/lightbox.component';
export * from './listicle/listicle.component';
export * from './quote/quote.component';
export * from './richtext/richtext.render';
export * from './title/title.render';
