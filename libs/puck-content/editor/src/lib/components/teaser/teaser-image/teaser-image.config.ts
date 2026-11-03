import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserImageConfigProps,
  TeaserImageRender,
} from '@wepublish/puck-content/website';
import { MdImage } from 'react-icons/md';

import { UserFields } from '../../../fields';
import {
  defaultImageFit,
  imageFitAiInstructions,
  imageFitField,
} from '../../../image-fit/image-fit.field';
import {
  hideWhenEmptyField,
  hideWhenEmptyInstructions,
  teaserPartRender,
} from '../teaser-part/teaser-part';

export const TeaserImageConfig: ComponentConfig<{
  props: TeaserImageConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Image',
  icon: MdImage,
  category: 'teaser',
  group: 'teaserParts',
  order: 1,
  nameKey: 'puck.blocks.names.TeaserImage',
  ai: {
    instructions:
      'Renders the image of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.' +
      hideWhenEmptyInstructions('image') +
      ` ${imageFitAiInstructions}`,
  },
  fields: {
    fit: imageFitField(),
    hideWhenEmpty: hideWhenEmptyField,
  },
  defaultProps: {
    fit: defaultImageFit,
    hideWhenEmpty: true,
  },
  render: teaserPartRender('TeaserImage', TeaserImageRender),
};
