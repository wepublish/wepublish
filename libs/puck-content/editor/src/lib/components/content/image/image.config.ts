import { ComponentConfig } from '@puckeditor/core';
import { ImageConfigProps } from '@wepublish/puck-content/website';
import { MdImage } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';
import {
  defaultImageFit,
  imageFitAiInstructions,
  imageFitField,
} from '../../../image-fit/image-fit.field';
import { switchFieldAi } from '../../../switch/switch.field';
import {
  withImageDataSource,
  WithDataSource,
} from '../../../blocks/with-datasource';
import { ImageEditorRender } from './image-editor.component';

export const ImageConfig: ComponentConfig<{
  props: WithDataSource<ImageConfigProps>;
  fields: UserFields;
}> = withImageDataSource<ImageConfigProps>({
  icon: MdImage,
  category: 'media',
  order: 1,
  nameKey: 'puck.blocks.names.Image',
  ai: {
    instructions:
      'A single image from the image library with an optional caption shown below it. Use it to illustrate the surrounding content. The image is referenced by the single image datasource. Keep the existing id and never invent one. The caption is a short descriptive text or credit. hideCaption hides the caption and the image credit below the image.' +
      ` ${imageFitAiInstructions}`,
  },
  fields: {
    caption: {
      type: 'text',
      ai: {
        instructions:
          'Short caption or credit shown below the image. Leave empty when there is nothing to add.',
      },
    },
    hideCaption: {
      type: 'switch',
      label: 'Hide caption',
      ai: switchFieldAi(
        'Whether the caption and the image credit below the image are hidden.'
      ),
    },
    fit: imageFitField(),
  },
  defaultProps: {
    hideCaption: false,
    fit: defaultImageFit,
  },
  render: editorRender(ImageEditorRender),
});
