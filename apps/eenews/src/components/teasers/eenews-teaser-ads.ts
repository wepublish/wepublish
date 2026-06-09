import { FullTeaserFragment, TeaserType } from '@wepublish/website/api';

export const AD_RECTANGLE_TITLE = 'ad-rectangle';

export const isAdTeaser = (
  teaser: FullTeaserFragment | null | undefined
): boolean =>
  teaser?.__typename === 'CustomTeaser' && teaser.title === AD_RECTANGLE_TITLE;

const createAdTeaser = (): FullTeaserFragment => ({
  __typename: 'CustomTeaser',
  type: TeaserType.Custom,
  title: AD_RECTANGLE_TITLE,
});

export const enrichTeasersWithAds = (
  teasers: FullTeaserFragment[]
): FullTeaserFragment[] =>
  teasers.reduce<FullTeaserFragment[]>((acc, teaser, index) => {
    if ((index + 4) % 6 === 0) {
      acc.push(createAdTeaser());
    }
    acc.push(teaser);
    return acc;
  }, []);
