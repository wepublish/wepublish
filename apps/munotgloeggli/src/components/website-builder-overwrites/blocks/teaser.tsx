import { BaseTeaser } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';

export const MunotgloeggliBaseTeaser = (props: BuilderTeaserProps) => {
  const { teaser } = props;

  if (teaser?.__typename === 'PageTeaser' && teaser.page) {
    const teaserWithoutDate = {
      ...teaser,
      page: {
        ...teaser.page,
        publishedAt: null,
        latest: {
          ...teaser.page.latest,
          publishedAt: null,
        },
      },
    } as typeof teaser;

    return (
      <BaseTeaser
        {...props}
        teaser={teaserWithoutDate}
      />
    );
  }

  return <BaseTeaser {...props} />;
};
