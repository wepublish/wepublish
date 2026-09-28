import { Prisma } from '@prisma/client';

/**
 * Columns that identify or track a provider row rather than configure it.
 * Everything else on a provider table is credentials or provider-specific
 * settings, which must not survive a type change.
 */
const PRESERVED_COLUMNS = [
  'id',
  'createdAt',
  'modifiedAt',
  'lastLoadedAt',
  'name',
  'type',
  'enabled',
];

/**
 * A patch that nulls every configuration column of a provider table.
 *
 * Derived from the schema rather than hand-listed: a credential added to the
 * model later is cleared without anyone having to remember this file.
 */
export const clearProviderConfig = (
  modelName: string
): Record<string, null> => {
  const model = Prisma.dmmf.datamodel.models.find(
    ({ name }) => name === modelName
  );

  if (!model) {
    throw new Error(`Unknown provider model ${modelName}`);
  }

  return Object.fromEntries(
    model.fields
      .filter(
        field =>
          field.kind === 'scalar' && !PRESERVED_COLUMNS.includes(field.name)
      )
      .map(field => [field.name, null])
  );
};
