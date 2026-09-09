import { FieldLabel, FieldProps } from '@puckeditor/core';

import {
  DatasourceField,
  DatasourceModels,
  DatasourceType,
  datasourceTypes,
  DatasourceValue,
  requiresModel,
} from './datasource.field';
import { useTranslation } from 'react-i18next';

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

export type DatasourceFieldRenderProps = FieldProps<
  DatasourceField,
  DatasourceValue
> & {
  name: string;
};

export const DatasourceFieldRender = ({
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
      el="div"
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
