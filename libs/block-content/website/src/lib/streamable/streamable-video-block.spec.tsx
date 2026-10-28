import { screen, waitFor } from '@testing-library/react';
import {
  mockStreamableVideoBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { StreamableVideoBlock } from './streamable-video-block';

const oEmbedUrl = (videoID: string) =>
  `https://api.streamable.com/oembed.json?url=${encodeURIComponent(
    `https://streamable.com/${videoID}`
  )}`;

const playerAspectRatio = () =>
  parseFloat(
    getComputedStyle(
      screen.getByTitle('Embedded Streamable Video')
        .parentElement as HTMLElement
    ).aspectRatio
  );

describe('StreamableVideoBlock', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const respondWith = (size: { width?: number; height?: number }) => {
    const response = new Response(JSON.stringify(size));
    fetchMock.mockResolvedValue(response);

    return response;
  };

  it('embeds the video through the Streamable player', () => {
    respondWith({ width: 1920, height: 1080 });

    renderWithProviders(
      <StreamableVideoBlock
        {...mockStreamableVideoBlock({ videoID: 'abc123' })}
      />
    );

    expect(screen.getByTitle('Embedded Streamable Video')).toHaveAttribute(
      'src',
      'https://streamable.com/e/abc123'
    );
  });

  it('asks Streamable oEmbed for the video size', () => {
    respondWith({ width: 1920, height: 1080 });

    renderWithProviders(
      <StreamableVideoBlock
        {...mockStreamableVideoBlock({ videoID: 'abc123' })}
      />
    );

    expect(fetchMock).toHaveBeenCalledWith(oEmbedUrl('abc123'), {
      signal: expect.any(AbortSignal),
    });
  });

  it('takes the aspect ratio of portrait videos from oEmbed', async () => {
    respondWith({ width: 1080, height: 1920 });

    renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock()} />
    );

    await waitFor(() => expect(playerAspectRatio()).toBe(1080 / 1920));
  });

  it('falls back to 16:9 when oEmbed has no size', async () => {
    const response = respondWith({});

    renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock()} />
    );

    await waitFor(() => expect(response.bodyUsed).toBe(true));
    expect(playerAspectRatio()).toBeCloseTo(16 / 9);
  });

  it('still shows the video in 16:9 when oEmbed fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock()} />
    );

    await expect(fetchMock.mock.results[0].value).rejects.toThrow(
      'Failed to fetch'
    );
    expect(screen.getByTitle('Embedded Streamable Video')).toBeInTheDocument();
    expect(playerAspectRatio()).toBeCloseTo(16 / 9);
  });

  it('cancels the oEmbed request when the video is removed', () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    const { unmount } = renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock()} />
    );
    const [, { signal }] = fetchMock.mock.calls[0] as [
      string,
      { signal: AbortSignal },
    ];

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('encodes the video id', () => {
    respondWith({});

    renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock({ videoID: 'a/b' })} />
    );

    expect(screen.getByTitle('Embedded Streamable Video')).toHaveAttribute(
      'src',
      'https://streamable.com/e/a%2Fb'
    );
    expect(fetchMock).toHaveBeenCalledWith(oEmbedUrl('a%2Fb'), {
      signal: expect.any(AbortSignal),
    });
  });

  it('renders nothing and requests nothing without a video id', () => {
    const { container } = renderWithProviders(
      <StreamableVideoBlock {...mockStreamableVideoBlock({ videoID: null })} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
