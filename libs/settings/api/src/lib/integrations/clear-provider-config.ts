import { Prisma } from '@prisma/client';

const PRESERVED_COLUMNS = [
  'id',
  'createdAt',
  'modifiedAt',
  'lastLoadedAt',
  'name',
  'type',
  'enabled',
  'deletedAt',
];

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
