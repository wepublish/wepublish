import {
  BlockRenderer,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import {
  BuilderBlockRendererProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { ReflektTeaser } from '../blocks/reflekt-teaser';

export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  if (isTeaserGridBlock(props.block)) {
    return (
      <WebsiteBuilderProvider blocks={{ Teaser: ReflektTeaser }}>
        <TeaserGrid {...props.block} />
      </WebsiteBuilderProvider>
    );
  }

  return <BlockRenderer {...props} />;
};
