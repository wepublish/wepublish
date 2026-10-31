import { ComponentConfig } from '@puckeditor/core';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import { withImageDataSource } from '../../with-datasource';
import { ImageConfigProps, ImageRender } from './image.component';

export const ImageConfig: ComponentConfig<{
  props: ImageConfigProps;
  fields: UserFields;
}> = withImageDataSource<ImageConfigProps>({
  ai: {
    instructions:
      'A single image from the image library with an optional caption shown below it. Use it to illustrate the surrounding content. The image is referenced by the single image datasource — keep the existing id and never invent one; caption is a short descriptive text or credit.',
  },
  fields: {
    caption: {
      type: 'text',
      ai: {
        instructions:
          'Short caption or credit shown below the image. Leave empty when there is nothing to add.',
      },
    },
    image: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {},
  render: ImageRender,
});
