import {
  BlockRenderer,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserGridBlock } from '@wepublish/website/api';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useCallback } from 'react';

import { isCenterText } from '../block-style/centter-text';

export const HauptstadtBlockRenderer = (props: BuilderBlockRendererProps) => {
  // Hauptstadt has some old related articles teasers
  // and we want to show them as small teasers instead of big teasers
  const isOldRelatedArticles = useCallback(
    (block: Pick<BlockContent, '__typename'>): block is TeaserGridBlock =>
      allPass([
        isTeaserGridBlock,
        () => props.type === 'Article' && props.index === props.count - 1,
      ])(block),
    [props.index, props.count, props.type]
  );

  const block =
    isOldRelatedArticles(props.block) ?
      ({ ...props.block, numColumns: 3 } as TeaserGridBlock)
    : props.block;

  return (
    <BlockRenderer
      {...props}
      block={block}
      css={isCenterText(props.block) ? { textAlign: 'center' } : undefined}
    />
  );
};
