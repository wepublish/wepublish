import { hasBlockStyle } from '../../has-blockstyle';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';
import { isFlexBlock } from '../../nested-blocks/flex-block';

export const TabbedContent = ({
  nestedBlocks,
}: BuilderBlockStyleProps['TabbedContent']) => {
  const {
    blocks: { Image },
  } = useWebsiteBuilder();

  return (
    <div>
      <Image></Image>TabbedContent Block Style
    </div>
  );
};

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([hasBlockStyle('TabbedContent'), isFlexBlock])(block);
