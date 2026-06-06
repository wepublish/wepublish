import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { UserConfig } from '../types';

export type DatasourcesWithModel =
  | { type: 'list'; model: DatasourceModels }
  | { type: 'autofill'; model: DatasourceModels }
  | { type: 'item'; model: DatasourceModels };
export type DatasourcesWithoutModel = { type: 'none' } | { type: 'slot' };
export type DatasourceValue = DatasourcesWithoutModel | DatasourcesWithModel;

export type DatasourceType = DatasourceValue['type'];

export const datasourceTypes = [
  'none',
  'slot',
  'list',
  'autofill',
  'item',
] as DatasourceType[];

export const datasourcesWithModel = [
  'list',
  'autofill',
  'item',
] satisfies DatasourcesWithModel['type'][];
export type ModelDatasourceType = DatasourcesWithModel['type'];

export type DatasourceModels = 'Article' | 'Page' | 'Memberplan' | 'Event';

export type DatasourceField = BaseField & {
  type: 'datasource';
  models?: DatasourceModels[];
};

const useDatasourceLabels = () => {
  const { t } = useTranslation();

  return {
    none: t('', 'None'),
    slot: t('', 'Slot'),
    list: t('', 'List'),
    autofill: t('', 'Autofill'),
    item: t('', 'Item'),
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
  const current = value ?? { type: 'none' };
  const models = field.models ?? ['Article', 'Page', 'Event', 'Memberplan'];

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
      <select
        value={current.type}
        disabled={readOnly}
        onChange={event =>
          handleTypeChange(event.currentTarget.value as DatasourceType)
        }
      >
        {datasourceTypes.map(type => (
          <option
            key={type}
            value={type}
          >
            {datasourceLabels[type]}
          </option>
        ))}
      </select>

      {requiresModel(current) && (
        <select
          value={current.model}
          disabled={readOnly}
          onChange={event =>
            onChange({
              type: current.type,
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

export const datasourcePlugin: Plugin<UserConfig> = {
  name: 'datasource',
  overrides: {
    fieldTypes: {
      datasource: DatasourceFieldRender,
    },
  },
};
