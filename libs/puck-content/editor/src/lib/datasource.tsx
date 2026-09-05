import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';
import { useTranslation } from 'react-i18next';

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

export const datasourceFieldAi = (
  types: DatasourceType[] = datasourceTypes,
  models: DatasourceModels[] = datasourceModels
): FieldAiParams => ({
  instructions: `Connects the component to CMS data. Set type to one of: ${types.join(', ')}. "none" keeps the content static, "slot" fills the component from a parent slot, "list" and "autofill" load a feed of records of a model, "item" and "items" reference specific records. For every type except none and slot also set model (one of: ${models.join(', ')}). id and ids reference existing records — never invent them; only set them to values the user provided.`,
  schema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: types },
      model: { type: 'string', enum: models },
      id: { type: 'string' },
      ids: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['type'],
    additionalProperties: false,
  },
});

const useDatasourceLabels = () => {
  const { t } = useTranslation();

  return {
    none: t('', 'None'),
    slot: t('', 'Slot'),
    list: t('', 'List'),
    autofill: t('', 'Autofill'),
    item: t('', 'Item'),
    items: t('', 'Multiple items'),
  };
};

const requiresModel = (type: DatasourceValue): type is DatasourcesWithModel => {
  return datasourcesWithModel.includes(
    type.type as DatasourcesWithModel['type']
  );
};

type DatasourceFieldRenderProps = FieldProps<
  DatasourceField,
  DatasourceValue
> & {
  name: string;
};

const DatasourceFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: DatasourceFieldRenderProps) => {
  const datasourceLabels = useDatasourceLabels();
  const models = field.models ?? ['Article', 'Page', 'Event', 'Memberplan'];
  const types = field.types ?? datasourceTypes;
  let current = value ?? { type: types[0] };

  if (requiresModel(current)) {
    current = { ...current, model: models[0] };
  }

  const handleTypeChange = (type: DatasourceType) => {
    let value = { ...current, type } as DatasourceValue;

    if (!requiresModel(value)) {
      value = { type } as typeof value;
    }

    onChange(value);
  };

  return (
    <FieldLabel
      label={field.label ?? 'Datasource'}
      readOnly={readOnly}
    >
      {types.length > 1 && (
        <select
          value={current.type}
          disabled={readOnly}
          onChange={event =>
            handleTypeChange(event.currentTarget.value as DatasourceType)
          }
        >
          {types.map(type => (
            <option
              key={type}
              value={type}
            >
              {datasourceLabels[type]}
            </option>
          ))}
        </select>
      )}

      {requiresModel(current) && models.length > 1 && (
        <select
          value={current.model}
          disabled={readOnly}
          onChange={event =>
            onChange({
              ...current,
              model: event.currentTarget.value as DatasourceModels,
            })
          }
        >
          <option value="">Select a model…</option>

          {models.map(model => (
            <option
              key={model}
              value={model}
            >
              {model}
            </option>
          ))}
        </select>
      )}
    </FieldLabel>
  );
};

export const datasourcePlugin: Plugin<UserFieldsConfig> = {
  name: 'datasource',
  overrides: {
    fieldTypes: {
      datasource: DatasourceFieldRender,
    },
  },
};
