import { alignmentForTeaserBlock } from '@wepublish/block-content/website';
import {
  FullEventFragment,
  FullArticleTeaserFragment,
  FullPageTeaserFragment,
  FullEventTeaserFragment,
  ArticleWithoutBlocksFragment,
  PageWithoutBlocksFragment,
  TeaserType,
} from '@wepublish/website/api';
import { BuilderTeaserProps, Teaser } from '@wepublish/website/builder';
import { CSSProperties, useMemo } from 'react';

export type TeaserItemProps = {
  className?: string;
  style?: CSSProperties;
  type: TeaserType;
  article?: ArticleWithoutBlocksFragment;
  page?: PageWithoutBlocksFragment;
  event?: FullEventFragment;
};

const alignment = alignmentForTeaserBlock(1, 1);

export function TeaserItem({
  type,
  article,
  event,
  page,
  className,
  style,
}: TeaserItemProps) {
  const teaser: BuilderTeaserProps['teaser'] = useMemo(() => {
    switch (type) {
      case TeaserType.Article:
        return {
          __typename: 'ArticleTeaser',
          type: TeaserType.Article,
          article,
        } as FullArticleTeaserFragment;

      case TeaserType.Page:
        return {
          __typename: 'PageTeaser',
          type: TeaserType.Page,
          page,
        } as FullPageTeaserFragment;

      case TeaserType.Event:
        return {
          __typename: 'EventTeaser',
          type: TeaserType.Event,
          event,
        } as FullEventTeaserFragment;
    }
  }, [type, article, page, event]);

  return (
    <Teaser
      className={className}
      style={style}
      teaser={teaser}
      alignment={alignment}
      index={1}
      blockStyle={''}
    />
  );
}
