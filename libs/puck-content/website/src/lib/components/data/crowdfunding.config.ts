import { ComponentConfig } from '@puckeditor/core';
import { CrowdfundingBlock } from '@wepublish/block-content/website';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export const CrowdfundingConfig: ComponentConfig<{
  props: BuilderCrowdfundingBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Shows the progress of a crowdfunding campaign towards its current goal. The crowdfunding data is loaded automatically and cannot be edited here.',
  },
  fields: {
    crowdfunding: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {},

  render: CrowdfundingBlock,
};
