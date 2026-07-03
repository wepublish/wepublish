import type {
  FullBlockFragment,
  IFrameBlock as IFrameBlockType,
  VimeoVideoBlock as VimeoVideoBlockType,
  YouTubeVideoBlock as YouTubeVideoBlockType,
} from '@wepublish/website/api';
import type { BuilderFlexBlockProps } from '@wepublish/website/builder';

export const isTrustedYouTubeUrl = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be'
    );
  } catch {
    return false;
  }
};

export const getYouTubeVideoId = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1) || null;
    }
    const v = url.searchParams.get('v');
    if (v) {
      return v;
    }
    const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
    return embedMatch ? embedMatch[1] : null;
  } catch {
    return null;
  }
};

export const getNativeVideoUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return /\.(mp4|webm)$/i.test(url.pathname) ? value : null;
  } catch {
    return null;
  }
};

export type HeroVideoInfo =
  | { kind: 'native'; src: string }
  | { kind: 'vimeo'; vimeoId: string }
  | { kind: 'youtube'; videoUrl: string };

export const resolveHeroVideo = (
  block?: FullBlockFragment | null
): HeroVideoInfo | null => {
  if (!block) {
    return null;
  }
  if (block.__typename === 'VimeoVideoBlock') {
    const vimeoId = (block as VimeoVideoBlockType).videoID;
    return vimeoId ? { kind: 'vimeo', vimeoId } : null;
  }
  if (block.__typename === 'YouTubeVideoBlock') {
    const youtubeId = (block as YouTubeVideoBlockType).videoID;
    return youtubeId ?
        {
          kind: 'youtube',
          videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        }
      : null;
  }
  if (block.__typename === 'IFrameBlock') {
    const url = (block as IFrameBlockType).url;
    const nativeVideoUrl = getNativeVideoUrl(url);
    if (nativeVideoUrl) {
      return { kind: 'native', src: nativeVideoUrl };
    }
    if (isTrustedYouTubeUrl(url)) {
      const youtubeId = getYouTubeVideoId(url);
      return youtubeId ?
          {
            kind: 'youtube',
            videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
          }
        : null;
    }
  }
  return null;
};

export type HeroNestedBlock = BuilderFlexBlockProps['blocks'][number];

export type HeroPosterVideoLayout = {
  mobileImage: HeroNestedBlock;
  desktopImage: HeroNestedBlock;
  mobileVideo: HeroVideoInfo;
  desktopVideo: HeroVideoInfo;
  richText: HeroNestedBlock | null;
};

export const detectHeroPosterVideoLayout = (
  sorted: HeroNestedBlock[]
): HeroPosterVideoLayout | null => {
  if (sorted.length < 4 || sorted.length > 5) {
    return null;
  }
  const [mobileImage, desktopImage, mobileVideoBlock, desktopVideoBlock, rich] =
    sorted;
  if (
    mobileImage?.block?.__typename !== 'ImageBlock' ||
    desktopImage?.block?.__typename !== 'ImageBlock'
  ) {
    return null;
  }
  const mobileVideo = resolveHeroVideo(
    mobileVideoBlock?.block as FullBlockFragment
  );
  const desktopVideo = resolveHeroVideo(
    desktopVideoBlock?.block as FullBlockFragment
  );
  if (!mobileVideo || !desktopVideo) {
    return null;
  }
  if (sorted.length === 5 && rich?.block?.__typename !== 'RichTextBlock') {
    return null;
  }
  return {
    mobileImage,
    desktopImage,
    mobileVideo,
    desktopVideo,
    richText: sorted.length === 5 ? rich : null,
  };
};
