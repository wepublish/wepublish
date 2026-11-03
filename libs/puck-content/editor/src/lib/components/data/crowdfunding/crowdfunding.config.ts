import { ComponentConfig } from '@puckeditor/core';
import { CrowdfundingRender } from '@wepublish/puck-content/website';
import { BuilderCrowdfundingBlockProps } from '@wepublish/website/builder';
import { MdVolunteerActivism } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { resolvedFieldAi } from '../../../resolved';
import { UserFields } from '../../../fields';

export const CrowdfundingConfig: ComponentConfig<{
  props: BuilderCrowdfundingBlockProps;
  fields: UserFields;
}> = {
  icon: MdVolunteerActivism,
  category: 'engagement',
  order: 6,
  nameKey: 'puck.blocks.names.Crowdfunding',
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

  render: editorRender(CrowdfundingRender),
};
