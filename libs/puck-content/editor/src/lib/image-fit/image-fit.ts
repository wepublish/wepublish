import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import {
  AspectRatioFieldRender,
  ObjectFitFieldRender,
} from './image-fit.component';

export const imageFitPlugin: Plugin<UserFieldsConfig> = {
  name: 'imageFit',
  overrides: {
    fieldTypes: {
      aspectRatio: AspectRatioFieldRender,
      objectFit: ObjectFitFieldRender,
    },
  },
};
