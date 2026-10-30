import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export const listDatasourceTypes = ['list', 'uniqueList', 'slot'] as const;
export const specificDatasourceTypes = ['single', 'multiple'] as const;
export const datasourceTypes = [
  ...listDatasourceTypes,
  ...specificDatasourceTypes,
] as const;

export type ListDatasourceType = (typeof listDatasourceTypes)[number];
export type DatasourceType = (typeof datasourceTypes)[number];

export const datasourceModels = [
  'article',
  'page',
  'event',
  'image',
  'memberplan',
  'userSubscription',
] as const;

export type DatasourceModel = (typeof datasourceModels)[number];

const listDatasourceSchema = z.union([
  z.object({
    type: z.literal('list'),
    data: z.array(z.json()).nullish(),
  }),
  z.object({
    type: z.literal('uniqueList'),
    data: z.array(z.json()).nullish(),
  }),
  z.object({
    type: z.literal('slot'),
    data: z.array(z.json()).nullish(),
  }),
]);

const specificDatasourceSchema = z.union([
  z.object({
    type: z.literal('single'),
    data: z.array(z.json()).nullish(),
    id: z.string(),
  }),
  z.object({
    type: z.literal('multiple'),
    data: z.array(z.json()).nullish(),
    ids: z.array(z.string()),
  }),
]);

const datasourceSchema = z.union([
  listDatasourceSchema,
  specificDatasourceSchema,
]);

export const datasourcesSchema = z.object({
  article: datasourceSchema.nullish(),
  page: datasourceSchema.nullish(),
  event: datasourceSchema.nullish(),
  image: datasourceSchema.nullish(),
  memberplan: datasourceSchema.nullish(),
  userSubscription: listDatasourceSchema.nullish(),
});

export type ListDatasource = z.infer<typeof listDatasourceSchema>;
export type Datasource = z.infer<typeof datasourceSchema>;
export type DatasourcesValue = z.infer<typeof datasourcesSchema>;

export type DatasourceField = BaseField & {
  type: 'datasource';
  models?: DatasourceModel[];
  types?: DatasourceType[];
};

export const toDatasourceTypes = (
  model: DatasourceModel,
  types: readonly DatasourceType[] = datasourceTypes
): DatasourceType[] =>
  model === 'userSubscription' ?
    types.filter((type): type is ListDatasourceType =>
      (listDatasourceTypes as readonly string[]).includes(type)
    )
  : [...types];

const toDatasource = (type: DatasourceType): Datasource => {
  switch (type) {
    case 'single':
      return { type, id: '' };
    case 'multiple':
      return { type, ids: [] };
    default:
      return { type };
  }
};

export const setDatasourceType = (
  value: DatasourcesValue,
  model: DatasourceModel,
  type: DatasourceType | undefined
): DatasourcesValue => {
  const { [model]: _previous, ...rest } = value;

  return type ? { ...rest, [model]: toDatasource(type) } : rest;
};

export const setDatasourceIds = (
  value: DatasourcesValue,
  model: DatasourceModel,
  raw: string
): DatasourcesValue => {
  const current = value[model];

  if (current?.type === 'single') {
    return { ...value, [model]: { type: 'single', id: raw.trim() } };
  }

  if (current?.type === 'multiple') {
    return {
      ...value,
      [model]: {
        type: 'multiple',
        ids: raw
          .split(',')
          .map(id => id.trim())
          .filter(Boolean),
      },
    };
  }

  return value;
};

export const setDatasourceIdList = (
  value: DatasourcesValue,
  model: DatasourceModel,
  ids: string[]
): DatasourcesValue => {
  const current = value[model];

  if (current?.type === 'single') {
    return { ...value, [model]: { type: 'single', id: ids[0] ?? '' } };
  }

  if (current?.type === 'multiple') {
    return {
      ...value,
      [model]: { type: 'multiple', ids: ids.filter(Boolean) },
    };
  }

  return value;
};

export const datasourceIds = (
  value: DatasourcesValue | null | undefined,
  model: DatasourceModel
): string[] => {
  const current = value?.[model];

  if (current?.type === 'single') {
    return current.id ? [current.id] : [];
  }

  if (current?.type === 'multiple') {
    return current.ids;
  }

  return [];
};

const aiDatasourceSchema = (types: readonly DatasourceType[]) =>
  z.object({
    type: z.enum(types as [DatasourceType, ...DatasourceType[]]),
    id: z.string().optional(),
    ids: z.array(z.string()).optional(),
  });

export const datasourceFieldAi = (
  types: readonly DatasourceType[] = datasourceTypes,
  models: readonly DatasourceModel[] = datasourceModels
): FieldAiParams => ({
  instructions: `Connects the component to CMS data, one entry per model (${models.join(', ')}); leave a model out to not use it. Set type to one of: ${types.join(', ')}. "list" loads a feed of records, "uniqueList" a feed that skips records already shown elsewhere on the page, "slot" fills the component from a parent slot, "single" references one record by id and "multiple" several records by ids. id and ids reference existing records — never invent them; only set them to values the user provided.`,
  schema: toAiSchema(
    z
      .object(
        Object.fromEntries(
          models.map(model => [
            model,
            aiDatasourceSchema(toDatasourceTypes(model, types)).optional(),
          ])
        )
      )
      .describe('Datasources per model')
  ),
});
