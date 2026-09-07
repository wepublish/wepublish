import { FullTeaserFragment } from '@wepublish/website/api';
import { BuilderTeaserProps } from '@wepublish/website/builder';

import {
  getCompactNewsFillerCount,
  isTeaserCompactNews,
  parseCompactNewsConfig,
} from './teaser-compact-news';

const customTeaser = (
  properties: Array<{ key: string; value: string }> | null
) =>
  ({
    __typename: 'CustomTeaser',
    properties,
  }) as unknown as FullTeaserFragment;

const articleTeaser = () =>
  ({
    __typename: 'ArticleTeaser',
    article: {},
  }) as unknown as FullTeaserFragment;

const asProps = (teaser: FullTeaserFragment | null | undefined) =>
  ({ teaser }) as unknown as BuilderTeaserProps;

describe('isTeaserCompactNews', () => {
  it('matches a custom teaser with the compact-news marker', () => {
    expect(
      isTeaserCompactNews(
        asProps(customTeaser([{ key: 'component', value: 'compact-news' }]))
      )
    ).toBe(true);
  });

  it('matches despite whitespace and casing in the marker', () => {
    expect(
      isTeaserCompactNews(
        asProps(customTeaser([{ key: ' Component ', value: ' Compact-News ' }]))
      )
    ).toBe(true);
  });

  it('does not match an article teaser', () => {
    expect(isTeaserCompactNews(asProps(articleTeaser()))).toBe(false);
  });

  it('does not match a custom teaser without the marker', () => {
    expect(isTeaserCompactNews(asProps(customTeaser([])))).toBe(false);
    expect(
      isTeaserCompactNews(
        asProps(customTeaser([{ key: 'component', value: 'something-else' }]))
      )
    ).toBe(false);
  });

  it('does not match a custom teaser without properties', () => {
    expect(isTeaserCompactNews(asProps(customTeaser(null)))).toBe(false);
  });

  it('does not match a missing teaser', () => {
    expect(isTeaserCompactNews(asProps(null))).toBe(false);
  });
});

describe('parseCompactNewsConfig', () => {
  it('reads the tag and count properties', () => {
    expect(
      parseCompactNewsConfig(
        customTeaser([
          { key: 'tag', value: ' kurznews ' },
          { key: 'count', value: '6' },
        ])
      )
    ).toEqual({ tag: 'kurznews', count: 6 });
  });

  it('defaults the count to 4', () => {
    expect(
      parseCompactNewsConfig(customTeaser([{ key: 'tag', value: 'kurznews' }]))
    ).toEqual({ tag: 'kurznews', count: 4 });
  });

  it('defaults the count to 4 for non-numeric values', () => {
    expect(
      parseCompactNewsConfig(
        customTeaser([
          { key: 'tag', value: 'kurznews' },
          { key: 'count', value: 'many' },
        ])
      )
    ).toEqual({ tag: 'kurznews', count: 4 });
  });

  it('clamps the count to 1..8', () => {
    expect(
      parseCompactNewsConfig(
        customTeaser([
          { key: 'tag', value: 'kurznews' },
          { key: 'count', value: '0' },
        ])
      ).count
    ).toBe(1);
    expect(
      parseCompactNewsConfig(
        customTeaser([
          { key: 'tag', value: 'kurznews' },
          { key: 'count', value: '99' },
        ])
      ).count
    ).toBe(8);
  });

  it('returns no tag when the property is missing or empty', () => {
    expect(parseCompactNewsConfig(customTeaser([])).tag).toBeUndefined();
    expect(
      parseCompactNewsConfig(customTeaser([{ key: 'tag', value: ' ' }])).tag
    ).toBeUndefined();
  });
});

describe('getCompactNewsFillerCount', () => {
  it('fills up to the configured count', () => {
    expect(getCompactNewsFillerCount(6, 2)).toBe(4);
    expect(getCompactNewsFillerCount(6, 6)).toBe(0);
  });

  it('always reserves the minimal amount of rows', () => {
    expect(getCompactNewsFillerCount(1, 1)).toBe(3);
    expect(getCompactNewsFillerCount(2, 0)).toBe(4);
    expect(getCompactNewsFillerCount(4, 4)).toBe(0);
  });
});
