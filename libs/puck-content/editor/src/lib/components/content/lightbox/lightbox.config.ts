import { ComponentConfig, registerOverlayPortal } from '@puckeditor/core';
import {
  LightboxConfigProps,
  LightboxExtra,
  LightboxRender,
} from '@wepublish/puck-content/website';
import { MdCollections } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { imageFieldAi } from '../../../image/image.field';
import { UserFields } from '../../../fields';
import {
  defaultImageFit,
  imageFitAiInstructions,
  imageFitField,
} from '../../../image-fit/image-fit.field';
import { switchFieldAi } from '../../../switch/switch.field';

const lightboxOverlayRefs: LightboxExtra['refs'] = {
  fullscreen: registerOverlayPortal,
  prev: registerOverlayPortal,
  next: registerOverlayPortal,
};

export const LightboxConfig: ComponentConfig<{
  props: LightboxConfigProps;
  fields: UserFields;
}> = {
  icon: MdCollections,
  category: 'media',
  order: 2,
  nameKey: 'puck.blocks.names.Lightbox',
  ai: {
    instructions:
      'An image gallery shown one image at a time with previous/next navigation, an image counter and a fullscreen mode. Use it for photo series or galleries. Add one item per image; imageId references an already uploaded image, so keep the existing value and never invent one; caption is a short descriptive text or credit shown below the image. hideCaption hides the captions and image credits of all images.' +
      ` ${imageFitAiInstructions}`,
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
    hideCaption: {
      type: 'switch',
      label: 'Hide captions',
      ai: switchFieldAi(
        'Whether the captions and image credits below the images are hidden.'
      ),
    },
    fit: imageFitField(),
  },
  defaultProps: {
    images: [{}],
    hideCaption: false,
    fit: defaultImageFit,
  },
  render: editorRender(LightboxRender, {
    useExtra: () => ({ refs: lightboxOverlayRefs }),
  }),
};
