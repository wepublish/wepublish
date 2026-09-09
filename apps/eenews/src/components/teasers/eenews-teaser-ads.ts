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
  teasers: FullTeaserFragment[],
  { limit = Infinity }: { limit?: number } = {}
): FullTeaserFragment[] => {
  let inserted = 0;
  return teasers.reduce<FullTeaserFragment[]>((acc, teaser, index) => {
    if ((index + 3) % 6 === 0 && inserted < limit) {
      acc.push(createAdTeaser());
      inserted++;
    }
    acc.push(teaser);
    return acc;
  }, []);
};
