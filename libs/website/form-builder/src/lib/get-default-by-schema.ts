import { InputSchemaMapping } from './utility/input-schema-mapping';
import { isArraySchema } from './utility/is-schema';
import * as v from 'valibot';

export const getDefaultBySchema = <Schema extends InputSchemaMapping[0]>(
  schema: Schema
): v.InferOutput<Schema> => {
  if (isArraySchema(schema)) {
    return [];
  }

  return undefined;
};
