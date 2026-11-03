import { ComponentConfig } from '@puckeditor/core';
import { BildwurfAdRender } from '@wepublish/puck-content/website';
import { BuilderBildwurfAdBlockProps } from '@wepublish/website/builder';
import { MdAdUnits } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const BildwurfAdConfig: ComponentConfig<{
  props: BuilderBildwurfAdBlockProps;
  fields: UserFields;
}> = {
  icon: MdAdUnits,
  category: 'embed',
  order: 7,
  nameKey: 'puck.blocks.names.BildwurfAd',
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

  render: editorRender(BildwurfAdRender),
};
