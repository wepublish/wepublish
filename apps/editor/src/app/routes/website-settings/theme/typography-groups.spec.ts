import { typographySchema } from './schema';
import { typographyGroups } from './typography-groups';

describe('typographyGroups', () => {
  it('groups the variants by their role', () => {
    expect(
      typographyGroups.map(({ key, variants }) => [key, [...variants]])
    ).toEqual([
      ['headings', ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']],
      ['text', ['body1', 'body2', 'caption']],
      [
        'teasers',
        ['teaserPretitle', 'teaserTitle', 'teaserLead', 'teaserMeta'],
      ],
      ['article', ['articleAuthors', 'peerInformation']],
      ['banner', ['bannerTitle', 'bannerText', 'bannerCta']],
      [
        'blocks',
        [
          'blockBreakTitle',
          'blockBreakBody',
          'blockTitlePreTitle',
          'blockQuote',
        ],
      ],
    ]);
  });

  it('contains every variant of the theme exactly once', () => {
    const variants = typographyGroups.flatMap(({ variants }) => variants);

    expect([...variants].sort()).toEqual(
      Object.keys(typographySchema.shape)
        .filter(key => key !== 'allVariants')
        .sort()
    );
  });
});
