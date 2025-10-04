import { InputSchemaMapping } from './input-schema-mapping';
import { isEnumSchema } from './is-schema';

export const getEnums = (
  input: InputSchemaMapping[0]
): Record<string, string> | null => {
  if (isEnumSchema(input)) {
    return input.enum;
  }

  return null;
};
