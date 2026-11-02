import { BaseField } from '@puckeditor/core';
import {
  AspectRatioValue,
  ImageFit,
  objectFitValues,
  ObjectFitValue,
} from '@wepublish/puck-content/website';
import { z } from 'zod/v4';

import {
  BreakpointsField,
  breakpointsFieldAi,
} from '../breakpoints/breakpoints.field';

export type AspectRatioField = BaseField & {
  type: 'aspectRatio';
};

export type ObjectFitField = BaseField & {
  type: 'objectFit';
};

export type { AspectRatioValue, ObjectFitValue };

export const aspectRatioSchema = z
  .string()
  .regex(/^(auto|\d+(\.\d+)?:\d+(\.\d+)?)$/)
  .describe(
    'Aspect ratio of the image frame as width:height, for example 1:1, 4:3, 3:2, 16:9, 21:9, 3:4, 2:3, 9:16 or any custom ratio like 5:4. auto keeps the original ratio of the image.'
  );

export const objectFitSchema = z
  .enum(objectFitValues)
  .describe(
    'How the image fills a frame with a fixed aspect ratio: cover fills it and crops around the focal point, contain shows the whole image, fill stretches it, none keeps the original size, scale-down behaves like contain but never enlarges. Only applies once aspectRatio is not auto.'
  );

export const defaultImageFit: ImageFit = {
  xs: { aspectRatio: 'auto', objectFit: 'cover' },
};

export const imageFitAiInstructions =
  'fit sets per breakpoint an aspectRatio (auto keeps the original image ratio) and an objectFit that decides how the image fills that ratio (cover crops around the focal point).';

export const imageFitField = (): BreakpointsField => ({
  type: 'breakpoints',
  label: 'Aspect ratio & fit',
  objectFields: {
    aspectRatio: { type: 'aspectRatio' },
    objectFit: { type: 'objectFit' },
  },
  ai: breakpointsFieldAi({
    aspectRatio: aspectRatioSchema,
    objectFit: objectFitSchema,
  }),
});
