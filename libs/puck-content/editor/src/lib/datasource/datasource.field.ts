import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type DatasourcesWithModel =
  | { type: 'list'; model: DatasourceModels }
  | { type: 'autofill'; model: DatasourceModels }
  | { type: 'item'; model: DatasourceModels; id?: string | null }
  | { type: 'items'; model: DatasourceModels; ids?: string[] };
export type DatasourcesWithoutModel = { type: 'none' } | { type: 'slot' };
export type DatasourceValue = DatasourcesWithoutModel | DatasourcesWithModel;

export type DatasourceType = DatasourceValue['type'];

export type DatasourceValueType<T extends DatasourceType> = DatasourceValue & {
  type: T;
};

export const datasourceTypes = [
  'none',
  'slot',
  'list',
  'autofill',
  'item',
  'items',
] satisfies DatasourceType[];

export const datasourcesWithModel = [
  'list',
  'autofill',
  'item',
  'items',
] satisfies DatasourcesWithModel['type'][];
export type ModelDatasourceType = DatasourcesWithModel['type'];

export type DatasourceModels = 'Article' | 'Page' | 'Memberplan' | 'Event';

export type DatasourceField = BaseField & {
  type: 'datasource';
  models?: DatasourceModels[];
  types?: DatasourceType[];
};

export const datasourceModels = [
  'Article',
  'Page',
  'Memberplan',
  'Event',
] satisfies DatasourceModels[];

export const requiresModel = (
  value: DatasourceValue
): value is DatasourcesWithModel => {
  return datasourcesWithModel.includes(
    value.type as DatasourcesWithModel['type']
  );
};

export const datasourceSchema = (
  types: DatasourceType[] = datasourceTypes,
  models: DatasourceModels[] = datasourceModels
) =>
  z.object({
    type: z.enum(types),
    model: z.enum(models).optional(),
    id: z.string().optional(),
    ids: z.array(z.string()).optional(),
  });

export const datasourceFieldAi = (
  types: DatasourceType[] = datasourceTypes,
  models: DatasourceModels[] = datasourceModels
): FieldAiParams => ({
  instructions: `Connects the component to CMS data. Set type to one of: ${types.join(', ')}. "none" keeps the content static, "slot" fills the component from a parent slot, "list" and "autofill" load a feed of records of a model, "item" and "items" reference specific records. For every type except none and slot also set model (one of: ${models.join(', ')}). id and ids reference existing records — never invent them; only set them to values the user provided.`,
  schema: toAiSchema(datasourceSchema(types, models)),
});
