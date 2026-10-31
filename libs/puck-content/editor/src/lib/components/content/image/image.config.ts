import { ComponentConfig } from '@puckeditor/core';
import { ImageConfigProps, ImageRender } from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';
import {
  withImageDataSource,
  WithDataSource,
} from '../../../blocks/with-datasource';

export const ImageConfig: ComponentConfig<{
  props: WithDataSource<ImageConfigProps>;
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
  },
  defaultProps: {},
  render: editorRender(ImageRender),
});
