import { ComponentConfig } from '@puckeditor/core';
import { BildwurfAdBlock } from '@wepublish/block-content/website';
import { BuilderBildwurfAdBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const BildwurfAdConfig: ComponentConfig<{
  props: BuilderBildwurfAdBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Displays an advertisement served by Bildwurf. Set zoneID to the Bildwurf ad zone identifier configured for this website. Only use it when the reader explicitly asks for an ad slot.',
  },
  fields: {
    zoneID: {
      type: 'text',
      label: 'Zone ID',
    },
  },
  defaultProps: {},

  render: BildwurfAdBlock,
};
