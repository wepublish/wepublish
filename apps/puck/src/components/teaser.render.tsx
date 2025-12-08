import { alignmentForTeaserBlock } from '@wepublish/block-content/website';
import {
  FullEventFragment,
  FullArticleTeaserFragment,
  FullPageTeaserFragment,
  FullEventTeaserFragment,
  ArticleWithoutBlocksFragment,
  PageWithoutBlocksFragment,
} from '@wepublish/website/api';
import { BuilderTeaserProps, Teaser } from '@wepublish/website/builder';
import { useMemo } from 'react';

export type TeaserItemProps = {
  className?: string;
  type: 'article' | 'page' | 'event' | 'custom';
  article?: ArticleWithoutBlocksFragment;
  page?: PageWithoutBlocksFragment;
  event?: FullEventFragment;
};

export function TeaserItem({
  type,
  article,
  event,
  page,
  className,
}: TeaserItemProps) {
  const cr: BuilderTeaserProps['teaser'] = useMemo(() => {
    switch (type) {
      case 'article':
        return {
          __typename: 'ArticleTeaser',
          article,
        } as FullArticleTeaserFragment;

      case 'page':
        return {
          __typename: 'PageTeaser',
          page,
        } as FullPageTeaserFragment;

      case 'event':
        return {
          __typename: 'EventTeaser',
          event,
        } as FullEventTeaserFragment;
    }
  }, [type, article, page, event]);

  return (
    <Teaser
      className={className}
      teaser={cr}
      alignment={alignmentForTeaserBlock(1, 1)}
      index={1}
      blockStyle={''}
    />
  );
}
