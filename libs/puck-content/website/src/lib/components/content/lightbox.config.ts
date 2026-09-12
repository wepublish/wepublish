import { ComponentConfig } from '@puckeditor/core';

import { imageFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { LightboxConfigProps, LightboxRender } from './lightbox.component';

export const LightboxConfig: ComponentConfig<{
  props: LightboxConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'An image gallery shown one image at a time with previous/next navigation, an image counter and a fullscreen mode. Use it for photo series or galleries. Add one item per image; imageId references an already uploaded image — keep the existing value and never invent one; caption is a short descriptive text or credit shown below the image.',
  },
  fields: {
    images: {
      type: 'array',
      min: 1,
      getItemSummary: (item, index = 0) => item.caption || `Image ${index + 1}`,
      arrayFields: {
        imageId: {
          type: 'image',
          ai: imageFieldAi,
        },
        caption: {
          type: 'text',
          ai: {
            instructions:
              'Short caption or credit shown below the image. Leave empty when there is nothing to add.',
          },
        },
      },
      defaultItemProps: {},
    },
  },
  defaultProps: {
    images: [{}],
  },
  render: LightboxRender,
};
