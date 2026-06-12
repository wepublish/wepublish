import { BaseTeaser } from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import { BuilderTeaserProps } from '@wepublish/website/builder';

const hidePageTeaserPublicationDate = (
  teaser: FullTeaserFragment | null | undefined
): FullTeaserFragment | null | undefined => {
  if (teaser?.__typename !== 'PageTeaser' || !teaser.page) {
    return teaser;
  }

  return {
    ...teaser,
    page: {
      ...teaser.page,
      publishedAt: null,
      latest: {
        ...teaser.page.latest,
        publishedAt: null,
      },
    },
  };
};

export const MunotgloeggliBaseTeaser = (props: BuilderTeaserProps) => (
  <BaseTeaser
    {...props}
    teaser={hidePageTeaserPublicationDate(props.teaser)}
  />
);
