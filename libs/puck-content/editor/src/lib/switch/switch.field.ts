import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type SwitchValue = boolean;

export type SwitchField = BaseField & {
  type: 'switch';
};

export const switchSchema = z.boolean();

export const switchFieldAi = (instructions: string): FieldAiParams => ({
  instructions,
  schema: toAiSchema(switchSchema),
});
