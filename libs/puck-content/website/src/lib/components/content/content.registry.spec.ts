import type { RichtextJSONDocument } from '@wepublish/richtext';
import type {
  BuilderBildwurfAdBlockProps,
  BuilderBreakBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderImageBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
} from '@wepublish/website/builder';

import { BreakRender } from '../break/break.component';
import {
  BildwurfAdRender,
  FacebookRender,
  FacebookVideoRender,
  HtmlRender,
  IFrameRender,
  InstagramRender,
  PolisRender,
  SoundCloudRender,
  StreamableRender,
  TikTokRender,
  TwitterRender,
  VimeoRender,
  YouTubeRender,
} from '../embed/embed.components';
import { ButtonRender } from './button/button.component';
import { ContentBlockProps, contentBlockRegistry } from './content.registry';
import { ImageRender } from './image/image.component';
import { LightboxRender } from './lightbox/lightbox.component';
import { ListicleRender } from './listicle/listicle.component';
import { QuoteRender } from './quote/quote.component';
import { RichTextRender } from './richtext/richtext.render';
import { TitleRender } from './title/title.render';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

describe('contentBlockRegistry', () => {
  it('renders every content block through its website render', () => {
    expect(contentBlockRegistry).toEqual({
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
    });
  });

  it('stores only the title texts of a title', () => {
    expectTypeOf<ContentBlockProps['Title']>().toEqualTypeOf<
      Pick<BuilderTitleBlockProps, 'title' | 'preTitle' | 'lead'>
    >();
  });

  it('stores only the rich text of a rich text block', () => {
    expectTypeOf<ContentBlockProps['RichText']>().toEqualTypeOf<
      Pick<BuilderRichTextBlockProps, 'richText'>
    >();
  });

  it('takes the images from data, not from the stored props', () => {
    expectTypeOf<ContentBlockProps['Image']>().toEqualTypeOf<
      Omit<BuilderImageBlockProps, 'image' | 'className'>
    >();
    expectTypeOf<ContentBlockProps['Quote']>().toEqualTypeOf<
      Omit<BuilderQuoteBlockProps, 'image' | 'className'>
    >();
    expectTypeOf<ContentBlockProps['Break']>().toEqualTypeOf<
      Omit<BuilderBreakBlockProps, 'image' | 'refs' | 'className'>
    >();
  });

  it('references the images of galleries and listicles by id', () => {
    expectTypeOf<ContentBlockProps['Lightbox']>().toEqualTypeOf<{
      images: Array<{ imageId?: string; caption?: string }>;
    }>();
    expectTypeOf<ContentBlockProps['Listicle']>().toEqualTypeOf<{
      items: Array<{
        title: string;
        richText: RichtextJSONDocument;
        imageId?: string;
      }>;
    }>();
  });

  it('stores the embed props without a class name', () => {
    expectTypeOf<ContentBlockProps['Html']>().toEqualTypeOf<
      Omit<BuilderHTMLBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['IFrame']>().toEqualTypeOf<
      Omit<BuilderIFrameBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['YouTube']>().toEqualTypeOf<
      Omit<BuilderYouTubeVideoBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Vimeo']>().toEqualTypeOf<
      Omit<BuilderVimeoVideoBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['TikTok']>().toEqualTypeOf<
      Omit<BuilderTikTokVideoBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['FacebookVideo']>().toEqualTypeOf<
      Omit<BuilderFacebookVideoBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Facebook']>().toEqualTypeOf<
      Omit<BuilderFacebookPostBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Instagram']>().toEqualTypeOf<
      Omit<BuilderInstagramPostBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Twitter']>().toEqualTypeOf<
      Omit<BuilderTwitterTweetBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['SoundCloud']>().toEqualTypeOf<
      Omit<BuilderSoundCloudTrackBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Streamable']>().toEqualTypeOf<
      Omit<BuilderStreamableVideoBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['Polis']>().toEqualTypeOf<
      Omit<BuilderPolisConversationBlockProps, 'className'>
    >();
    expectTypeOf<ContentBlockProps['BildwurfAd']>().toEqualTypeOf<
      Omit<BuilderBildwurfAdBlockProps, 'className'>
    >();
  });

  it('stores the label and look of a button', () => {
    expectTypeOf<keyof ContentBlockProps['Button']>().toEqualTypeOf<
      'text' | 'color' | 'variant' | 'elevated'
    >();
  });
});
