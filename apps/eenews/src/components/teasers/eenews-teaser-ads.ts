import { Teaser, TeaserType } from '@wepublish/website/api';

export const AD_RECTANGLE_TITLE = 'ad-rectangle';

export const isAdTeaser = (teaser: Teaser | null | undefined): boolean =>
  teaser?.__typename === 'CustomTeaser' && teaser.title === AD_RECTANGLE_TITLE;

const createAdTeaser = (): Teaser => ({
  __typename: 'CustomTeaser',
  type: TeaserType.Custom,
  title: AD_RECTANGLE_TITLE,
});

export const enrichTeasersWithAds = (teasers: Teaser[]): Teaser[] =>
  teasers.reduce<Teaser[]>((acc, teaser, index) => {
    if ((index + 3) % 6 === 0) {
      acc.push(createAdTeaser());
    }
    acc.push(teaser);
    return acc;
  }, []);
