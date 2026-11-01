import { renderWithProviders } from '@wepublish/mocks/website';
import type { WebsiteBuilderProps } from '@wepublish/website/builder';
import { createElement } from 'react';

import {
  emptyPuckBlockData,
  PuckBlockComponent,
} from '../../blocks/block.types';
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
} from './embed.components';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

type BuilderBlock = keyof WebsiteBuilderProps['blocks'];

const received: unknown[] = [];

const BlockProbe = (props: { className?: string }) => {
  received.push(props);

  return <div className={props.className} />;
};

const embeds: Array<
  [string, PuckBlockComponent<never>, BuilderBlock, Record<string, unknown>]
> = [
  ['HtmlRender', HtmlRender, 'HTML', { html: '<p>Hi</p>' }],
  [
    'IFrameRender',
    IFrameRender,
    'IFrame',
    { url: 'https://example.com', title: 'Example', sandbox: 'sandbox' },
  ],
  ['YouTubeRender', YouTubeRender, 'YouTubeVideo', { videoID: 'L7Yea1Qg5Lo' }],
  ['VimeoRender', VimeoRender, 'VimeoVideo', { videoID: '76979871' }],
  [
    'TikTokRender',
    TikTokRender,
    'TikTokVideo',
    { videoID: '123', userID: 'wepublish' },
  ],
  [
    'FacebookVideoRender',
    FacebookVideoRender,
    'FacebookVideo',
    { videoID: '456', userID: 'wepublish' },
  ],
  [
    'FacebookRender',
    FacebookRender,
    'FacebookPost',
    { postID: '789', userID: 'wepublish' },
  ],
  ['InstagramRender', InstagramRender, 'InstagramPost', { postID: 'CabcDef' }],
  [
    'TwitterRender',
    TwitterRender,
    'TwitterTweet',
    { userID: 'wepublish', tweetID: '42' },
  ],
  ['SoundCloudRender', SoundCloudRender, 'SoundCloudTrack', { trackID: '1' }],
  ['StreamableRender', StreamableRender, 'StreamableVideo', { videoID: 'x1' }],
  ['PolisRender', PolisRender, 'PolisConversation', { conversationID: 'conv' }],
  ['BildwurfAdRender', BildwurfAdRender, 'BildwurfAd', { zoneID: 'zone' }],
];

beforeEach(() => {
  received.length = 0;
});

describe.each(embeds)('%s', (_name, Render, block, props) => {
  const renderEmbed = () =>
    renderWithProviders(
      createElement(Render as PuckBlockComponent<Record<string, unknown>>, {
        id: 'Embed-1',
        props,
        data: emptyPuckBlockData,
        slots: {},
        styling: { xs: { opacity: 50 } },
        visibility: { disabled: false },
        className: 'styled-block',
      }),
      { builder: { blocks: { [block]: BlockProbe } } }
    );

  it('renders the builder block with the stored props and the class name', () => {
    renderEmbed();

    expect(received).toEqual([{ ...props, className: 'styled-block' }]);
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderEmbed();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
