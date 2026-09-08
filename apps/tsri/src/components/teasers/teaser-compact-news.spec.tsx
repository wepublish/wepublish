import { BuilderTeaserProps } from '@wepublish/website/builder';

import {
  COMPACT_NEWS_TEASER_STYLE,
  getCompactNewsFillerCount,
  isTeaserCompactNews,
} from './teaser-compact-news';

describe('isTeaserCompactNews', () => {
  it('matches the compact-news row block style', () => {
    expect(
      isTeaserCompactNews({
        blockStyle: COMPACT_NEWS_TEASER_STYLE,
      } as BuilderTeaserProps)
    ).toBe(true);
  });

  it('does not match other block styles', () => {
    expect(
      isTeaserCompactNews({
        blockStyle: 'T_FullsizeImage',
      } as BuilderTeaserProps)
    ).toBe(false);
    expect(
      isTeaserCompactNews({ blockStyle: null } as BuilderTeaserProps)
    ).toBe(false);
  });
});

describe('getCompactNewsFillerCount', () => {
  it('fills up to the minimal amount of rows', () => {
    expect(getCompactNewsFillerCount(0)).toBe(4);
    expect(getCompactNewsFillerCount(1)).toBe(3);
    expect(getCompactNewsFillerCount(4)).toBe(0);
  });

  it('adds no fillers beyond the minimum', () => {
    expect(getCompactNewsFillerCount(6)).toBe(0);
  });
});
