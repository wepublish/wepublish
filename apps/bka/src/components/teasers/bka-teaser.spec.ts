import { FullTeaserFragment } from '@wepublish/website/api';
import { BuilderTeaserProps } from '@wepublish/website/builder';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { selectBkaTeaserTags } from './bka-teaser-selectors';
import { isBkaEmpfehlungTeaser, isBkaMagazinTeaser } from './bka-teaser';

describe('teaser block style predicates', () => {
  it('matches the magazin block style', () => {
    expect(
      isBkaMagazinTeaser({
        blockStyle: BkaBlockStyle.Magazin,
      } as BuilderTeaserProps)
    ).toBe(true);
  });

  it('matches the empfehlung block style', () => {
    expect(
      isBkaEmpfehlungTeaser({
        blockStyle: BkaBlockStyle.Empfehlung,
      } as BuilderTeaserProps)
    ).toBe(true);
  });

  it('does not match a foreign or missing block style', () => {
    expect(
      isBkaMagazinTeaser({ blockStyle: 'Alternating' } as BuilderTeaserProps)
    ).toBe(false);
    expect(isBkaMagazinTeaser({ blockStyle: null } as BuilderTeaserProps)).toBe(
      false
    );
  });
});

describe('selectBkaTeaserTags', () => {
  const tag = (id: string, main: boolean) => ({
    __typename: 'Tag' as const,
    id,
    tag: id,
    main,
    url: `/a/tag/${id}`,
  });

  it('returns every tag, not just the main ones', () => {
    // The shared selectTeaserTags keeps only `main` tags. None of BKa's tags
    // are flagged main, so filtering on it would render no chips at all.
    const teaser = {
      __typename: 'ArticleTeaser',
      article: { tags: [tag('Kunst', false), tag('Ausstellung', false)] },
    } as unknown as FullTeaserFragment;

    expect(selectBkaTeaserTags(teaser).map(({ id }) => id)).toEqual([
      'Kunst',
      'Ausstellung',
    ]);
  });

  it('reads tags from page and event teasers too', () => {
    expect(
      selectBkaTeaserTags({
        __typename: 'PageTeaser',
        page: { tags: [tag('Musik', false)] },
      } as unknown as FullTeaserFragment)
    ).toHaveLength(1);

    expect(
      selectBkaTeaserTags({
        __typename: 'EventTeaser',
        event: { tags: [tag('Musik', false)] },
      } as unknown as FullTeaserFragment)
    ).toHaveLength(1);
  });

  it('returns an empty list for teasers without tags', () => {
    expect(selectBkaTeaserTags(null)).toEqual([]);
    expect(selectBkaTeaserTags(undefined)).toEqual([]);
    expect(
      selectBkaTeaserTags({
        __typename: 'CustomTeaser',
      } as unknown as FullTeaserFragment)
    ).toEqual([]);
  });
});
