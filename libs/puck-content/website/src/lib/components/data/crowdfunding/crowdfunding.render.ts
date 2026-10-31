import {
  BuilderCrowdfundingBlockProps,
  CrowdfundingBlock,
} from '@wepublish/website/builder';

import { builderBlock } from '../../../blocks/builder-block';

export const CrowdfundingRender =
  builderBlock<BuilderCrowdfundingBlockProps>(CrowdfundingBlock);
