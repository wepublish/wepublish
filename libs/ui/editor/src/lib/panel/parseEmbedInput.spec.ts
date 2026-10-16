import { EmbedType } from '../blocks/types';
import { parseEmbedInput } from './parseEmbedInput';

describe('parseEmbedInput', () => {
  it('recognises a YouTube link', () => {
    expect(parseEmbedInput('https://www.youtube.com/watch?v=abc123')).toEqual({
      embed: { type: EmbedType.YouTubeVideo, videoID: 'abc123' },
    });
  });

  it('recognises a Vimeo link', () => {
    expect(parseEmbedInput('https://vimeo.com/76979871')).toEqual({
      embed: { type: EmbedType.VimeoVideo, videoID: '76979871' },
    });
  });

  it('recognises a tweet', () => {
    expect(parseEmbedInput('https://twitter.com/someone/status/12345')).toEqual(
      {
        embed: {
          type: EmbedType.TwitterTweet,
          userID: 'someone',
          tweetID: '12345',
        },
      }
    );
  });

  it('keeps the attributes of a pasted iframe', () => {
    const { embed } = parseEmbedInput(
      '<iframe src="/embedded" title="Demo" width="560" height="315"></iframe>'
    );

    expect(embed).toMatchObject({
      type: EmbedType.Other,
      url: expect.stringContaining('/embedded'),
      title: 'Demo',
      width: 560,
      height: 315,
    });
  });

  it('treats a bare URL as a plain embed', () => {
    expect(parseEmbedInput('https://example.com/thing')).toEqual({
      embed: { type: EmbedType.Other, url: 'https://example.com/thing' },
    });
  });

  it('reports input that is not a URL at all', () => {
    const { embed, invalidURL } = parseEmbedInput('not a url');

    expect(embed).toEqual({ type: EmbedType.Other });
    expect(invalidURL).toBe(true);
  });

  it('says nothing about empty input', () => {
    expect(parseEmbedInput('')).toEqual({ embed: { type: EmbedType.Other } });
  });
});
