import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

export type AiSchema = NonNullable<FieldAiParams['schema']>;

/**
 * Converts a zod schema into the JSON schema the puck AI plugin expects.
 * Compose nested schemas in zod and convert once at the outermost field so
 * recursive definitions end up in a single `$defs` at the root.
 */
export const toAiSchema = (schema: z.ZodType): AiSchema => {
  const jsonSchema = z.toJSONSchema(schema);
  delete jsonSchema.$schema;

  return jsonSchema as AiSchema;
};
