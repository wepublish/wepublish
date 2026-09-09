import { ComponentConfig } from '@puckeditor/core';

import { imageFieldAi, resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { ImageConfigProps, ImageRender } from './image.component';

export const ImageConfig: ComponentConfig<{
  props: ImageConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A single image from the image library with an optional caption shown below it. Use it to illustrate the surrounding content. imageId references an already uploaded image — keep the existing value and never invent one; caption is a short descriptive text or credit.',
  },
  fields: {
    imageId: {
      type: 'image',
      ai: imageFieldAi,
    },
    caption: {
      type: 'text',
      contentEditable: true,
      ai: {
        instructions:
          'Short caption or credit shown below the image. Leave empty when there is nothing to add.',
      },
    },
    image: {
      type: 'resolved',
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {},
  render: ImageRender,
};
