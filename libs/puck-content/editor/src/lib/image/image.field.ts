import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

/**
 * The id of an image in the image library.
 */
export type ImageValue = string;

/**
 * Picks an image from the library or uploads a new one. The value is the id
 * of the image only, components resolve it themselves.
 *
 * @example
 * image: {
 *   type: 'image',
 *   label: 'Image',
 * }
 */
export type ImageField = BaseField & {
  type: 'image';
};

export const imageSchema = z
  .string()
  .describe(
    'The id of an existing image in the image library. Keep the existing value and never invent one.'
  );

export const imageFieldAi: FieldAiParams = {
  instructions:
    'The id of an existing image in the image library. Keep the existing value and never invent one.',
  schema: toAiSchema(imageSchema),
};
