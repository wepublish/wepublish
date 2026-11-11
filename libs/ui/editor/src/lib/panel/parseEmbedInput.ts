import { EmbedBlockValue, EmbedType } from '../blocks/types';
import { flattenDOMTokenList } from '../utility';

export type ParsedEmbed = {
  embed: EmbedBlockValue;
  invalidURL?: true;
};

export function parseEmbedInput(input: string): ParsedEmbed {
  const patterns = [
    [
      /facebook.com\/(.+)\/posts\/([0-9]+)/,
      ([userID, postID]: string[]) => ({
        type: EmbedType.FacebookPost,
        userID,
        postID,
      }),
    ],
    [
      /facebook.com\/(.+)\/videos\/([0-9]+)/,
      ([userID, videoID]: string[]) => ({
        type: EmbedType.FacebookVideo,
        userID,
        videoID,
      }),
    ],
    [
      /instagram.com\/p\/([0-9a-zA-Z-_]+)/,
      ([postID]: string[]) => ({ type: EmbedType.InstagramPost, postID }),
    ],
    [
      /twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/,
      ([userID, tweetID]: string[]) => ({
        type: EmbedType.TwitterTweet,
        userID,
        tweetID,
      }),
    ],
    [
      /vimeo.com\/([0-9]+)/,
      ([videoID]: string[]) => ({ type: EmbedType.VimeoVideo, videoID }),
    ],
    [
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([0-9a-zA-Z-_]+)/,
      ([videoID]: string[]) => ({ type: EmbedType.YouTubeVideo, videoID }),
    ],
    [
      /pol.is\/([0-9a-zA-Z-_]+)/,
      ([conversationID]: string[]) => ({
        type: EmbedType.PolisConversation,
        conversationID,
      }),
    ],
    [
      /tiktok\.com\/@([0-9a-zA-Z-_.]+)\/video\/([0-9]+)/,
      ([userID, videoID]: string[]) => ({
        type: EmbedType.TikTokVideo,
        userID,
        videoID,
      }),
    ],
    [
      /data-zone="([0-9a-zA-Z-_]+)"/,
      ([zoneID]: string[]) => ({ type: EmbedType.BildwurfAd, zoneID }),
    ],
    [
      /nostreamable\.com\/(?:e\/)?([0-9a-zA-Z-_]+)/,
      ([videoID]: string[]) => ({ type: EmbedType.StreamableVideo, videoID }),
    ],
  ] as const;

  for (const [pattern, build] of patterns) {
    const match = input.match(pattern);

    if (match) {
      return { embed: build(match.slice(1)) as EmbedBlockValue };
    }
  }

  if (!input) {
    return { embed: { type: EmbedType.Other } };
  }

  const iframe = new DOMParser()
    .parseFromString(input, 'text/html')
    .getElementsByTagName('iframe')[0];

  if (iframe) {
    const soundCloudMatch = iframe.src.match(
      /api.soundcloud.com\/tracks\/([0-9]+)/
    );

    if (soundCloudMatch) {
      return {
        embed: { type: EmbedType.SoundCloudTrack, trackID: soundCloudMatch[1] },
      };
    }

    return {
      embed: {
        type: EmbedType.Other,
        url: iframe.src,
        title: iframe.title,
        width: iframe.width ? parseInt(iframe.width) : undefined,
        height: iframe.height ? parseInt(iframe.height) : undefined,
        styleCustom: iframe.style?.cssText ? iframe.style.cssText : '',
        sandbox:
          iframe.sandbox ? flattenDOMTokenList(iframe.sandbox) : undefined,
      },
    };
  }

  try {
    return {
      embed: { type: EmbedType.Other, url: new URL(input).toString() },
    };
  } catch {
    return { embed: { type: EmbedType.Other }, invalidURL: true };
  }
}
