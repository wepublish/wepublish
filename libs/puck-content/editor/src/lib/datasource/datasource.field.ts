import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { ImageListTarget } from '../image/image.field';
import { RecordModel } from '../record/record.field';

export { datasourceIds } from '@wepublish/puck-content/website';

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
  'memberPlan',
  'userSubscription',
] as const;

export type DatasourceModel = (typeof datasourceModels)[number];

const listDatasourceSchema = z.union([
  z.object({ type: z.literal('list') }),
  z.object({ type: z.literal('uniqueList') }),
  z.object({ type: z.literal('slot') }),
]);

const specificDatasourceSchema = z.union([
  z.object({ type: z.literal('single'), id: z.string() }),
  z.object({ type: z.literal('multiple'), ids: z.array(z.string()) }),
]);

const datasourceSchema = z.union([
  listDatasourceSchema,
  specificDatasourceSchema,
]);

export const datasourcesSchema = z.object({
  article: datasourceSchema.nullish(),
  page: datasourceSchema.nullish(),
  event: datasourceSchema.nullish(),
  image: specificDatasourceSchema.nullish(),
  memberPlan: datasourceSchema.nullish(),
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

const datasourceTypesByModel: Partial<
  Record<DatasourceModel, readonly DatasourceType[]>
> = {
  image: specificDatasourceTypes,
  userSubscription: listDatasourceTypes,
};

export const toDatasourceTypes = (
  model: DatasourceModel,
  types: readonly DatasourceType[] = datasourceTypes
): DatasourceType[] => {
  const allowed = datasourceTypesByModel[model] ?? datasourceTypes;

  return types.filter(type => allowed.includes(type));
};

const toDatasource = (
  type: DatasourceType,
  previousIds: string[]
): Datasource => {
  switch (type) {
    case 'single':
      return { type, id: previousIds[0] ?? '' };
    case 'multiple':
      return { type, ids: previousIds };
    default:
      return { type };
  }
};

export const rememberDatasourceIds = (
  remembered: string[],
  datasource: Datasource | null | undefined
): string[] => {
  if (datasource?.type === 'multiple') {
    return datasource.ids;
  }

  if (datasource?.type === 'single') {
    if (!datasource.id) {
      return [];
    }

    return remembered[0] === datasource.id ? remembered : [datasource.id];
  }

  return remembered;
};

export const setDatasourceType = (
  value: DatasourcesValue,
  model: DatasourceModel,
  type: DatasourceType | undefined,
  remembered: string[] = []
): DatasourcesValue => {
  if (!type) {
    const { [model]: _previous, ...rest } = value;

    return rest;
  }

  if (value[model]?.type === type || !toDatasourceTypes(model, [type]).length) {
    return value;
  }

  return {
    ...value,
    [model]: toDatasource(
      type,
      rememberDatasourceIds(remembered, value[model])
    ),
  };
};

export const addDatasourceModel = (
  value: DatasourcesValue,
  model: DatasourceModel,
  types: readonly DatasourceType[] = datasourceTypes
): DatasourcesValue => {
  const [type] = toDatasourceTypes(model, types);

  if (value[model] || !type) {
    return value;
  }

  return setDatasourceType(value, model, type);
};

export const activeDatasourceModels = (
  value: DatasourcesValue | null | undefined,
  models: readonly DatasourceModel[] = datasourceModels
): DatasourceModel[] => models.filter(model => !!value?.[model]);

export const addableDatasourceModels = (
  value: DatasourcesValue | null | undefined,
  models: readonly DatasourceModel[] = datasourceModels,
  types: readonly DatasourceType[] = datasourceTypes
): DatasourceModel[] =>
  models.filter(
    model => !value?.[model] && toDatasourceTypes(model, types).length > 0
  );

export type DirectDatasource = {
  model: DatasourceModel;
  type: DatasourceType;
};

export const directDatasource = (
  models: readonly DatasourceModel[] = datasourceModels,
  types: readonly DatasourceType[] = datasourceTypes
): DirectDatasource | undefined => {
  if (models.length !== 1) {
    return undefined;
  }

  const [model] = models;
  const available = toDatasourceTypes(model, types);

  return available.length === 1 ? { model, type: available[0] } : undefined;
};

const datasourceRecordModels: Partial<Record<DatasourceModel, RecordModel>> = {
  article: 'article',
  page: 'page',
  event: 'event',
  memberPlan: 'memberPlan',
};

export const toDatasourceRecordModel = (
  model: DatasourceModel
): RecordModel | undefined => datasourceRecordModels[model];

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
  instructions: `Connects the component to CMS data, one entry per model (${models.join(', ')}); leave a model out to not use it. Set type to one of: ${types.join(', ')}. "list" loads the newest records, "uniqueList" the newest records not already shown elsewhere on the page, "slot" takes the next record from the nearest surrounding component with data of the same model, "single" references one record by id and "multiple" several records by ids in display order. id and ids reference existing records: never invent them, and only set them to values the user provided.`,
  schema: toAiSchema(
    z
      .object(
        Object.fromEntries(
          models.flatMap(model => {
            const allowed = toDatasourceTypes(model, types);

            return allowed.length ?
                [[model, aiDatasourceSchema(allowed).optional()]]
              : [];
          })
        )
      )
      .describe('Datasources per model')
  ),
});

const datasourcesOf = (
  props: Parameters<ImageListTarget['read']>[0]
): DatasourcesValue => props['datasources'] ?? {};

export const imageDatasourceTarget: ImageListTarget = {
  read: props => {
    const image = datasourcesOf(props).image;

    return image?.type === 'multiple' ? image.ids : undefined;
  },
  write: (props, ids) => ({
    ...props,
    datasources: setDatasourceIdList(datasourcesOf(props), 'image', ids),
  }),
};
