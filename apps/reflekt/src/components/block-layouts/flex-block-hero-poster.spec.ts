import {
  detectHeroPosterVideoLayout,
  HeroNestedBlock,
  resolveHeroVideo,
} from './flex-block-hero-poster';

type ResolveInput = Parameters<typeof resolveHeroVideo>[0];

const resolve = (block: unknown) => resolveHeroVideo(block as ResolveInput);

const nested = (block: unknown): HeroNestedBlock =>
  ({ block, alignment: { x: 0, y: 0, w: 1, h: 1 } }) as HeroNestedBlock;

const image = () => nested({ __typename: 'ImageBlock' });
const vimeo = (videoID = '123456') =>
  nested({ __typename: 'VimeoVideoBlock', videoID });
const youtube = (videoID = 'abcDEF') =>
  nested({ __typename: 'YouTubeVideoBlock', videoID });
const iframe = (url: string) => nested({ __typename: 'IFrameBlock', url });
const richText = () => nested({ __typename: 'RichTextBlock' });
const soundcloud = () => nested({ __typename: 'SoundCloudTrackBlock' });

describe('resolveHeroVideo', () => {
  it('resolves a Vimeo block', () => {
    expect(resolve({ __typename: 'VimeoVideoBlock', videoID: '42' })).toEqual({
      kind: 'vimeo',
      vimeoId: '42',
    });
  });

  it('resolves a YouTube block', () => {
    expect(
      resolve({ __typename: 'YouTubeVideoBlock', videoID: 'xyz' })
    ).toEqual({
      kind: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=xyz',
    });
  });

  it('resolves a native mp4/webm IFrame as native', () => {
    expect(
      resolve({
        __typename: 'IFrameBlock',
        url: 'https://cdn.example.com/hero.mp4',
      })
    ).toEqual({ kind: 'native', src: 'https://cdn.example.com/hero.mp4' });
  });

  it('resolves a YouTube IFrame url as youtube', () => {
    expect(
      resolve({
        __typename: 'IFrameBlock',
        url: 'https://www.youtube.com/watch?v=qwerty',
      })
    ).toEqual({
      kind: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=qwerty',
    });
  });

  it('returns null for a non-video IFrame, image, soundcloud, or missing block', () => {
    expect(
      resolve({ __typename: 'IFrameBlock', url: 'https://example.com' })
    ).toBeNull();
    expect(resolve({ __typename: 'ImageBlock' })).toBeNull();
    expect(resolve({ __typename: 'SoundCloudTrackBlock' })).toBeNull();
    expect(resolve(null)).toBeNull();
  });
});

describe('detectHeroPosterVideoLayout', () => {
  it('matches image, image, video, video, richtext', () => {
    const layout = detectHeroPosterVideoLayout([
      image(),
      image(),
      vimeo(),
      youtube(),
      richText(),
    ]);
    expect(layout).not.toBeNull();
    expect(layout?.mobileVideo).toEqual({ kind: 'vimeo', vimeoId: '123456' });
    expect(layout?.desktopVideo.kind).toBe('youtube');
    expect(layout?.richText).not.toBeNull();
  });

  it('matches without the optional richtext block', () => {
    const layout = detectHeroPosterVideoLayout([
      image(),
      image(),
      iframe('https://cdn.example.com/a.webm'),
      vimeo(),
    ]);
    expect(layout).not.toBeNull();
    expect(layout?.mobileVideo).toEqual({
      kind: 'native',
      src: 'https://cdn.example.com/a.webm',
    });
    expect(layout?.richText).toBeNull();
  });

  it('does not match the default hero (two images + richtext)', () => {
    expect(
      detectHeroPosterVideoLayout([image(), image(), richText()])
    ).toBeNull();
  });

  it('does not match with only one leading image', () => {
    expect(
      detectHeroPosterVideoLayout([image(), vimeo(), youtube()])
    ).toBeNull();
  });

  it('does not match when a video slot is not a video', () => {
    expect(
      detectHeroPosterVideoLayout([image(), image(), image(), youtube()])
    ).toBeNull();
    expect(
      detectHeroPosterVideoLayout([image(), image(), soundcloud(), youtube()])
    ).toBeNull();
  });

  it('does not match the wrong order (videos before images)', () => {
    expect(
      detectHeroPosterVideoLayout([vimeo(), youtube(), image(), image()])
    ).toBeNull();
  });

  it('does not match when the 5th block is not richtext', () => {
    expect(
      detectHeroPosterVideoLayout([
        image(),
        image(),
        vimeo(),
        youtube(),
        image(),
      ])
    ).toBeNull();
  });

  it('does not match too many blocks', () => {
    expect(
      detectHeroPosterVideoLayout([
        image(),
        image(),
        vimeo(),
        youtube(),
        richText(),
        richText(),
      ])
    ).toBeNull();
  });
});
