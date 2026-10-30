import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { FieldSelect } from '../field-controls.component';
import { FieldInput, FieldStack } from '../field-controls';
import { ImagePicker, ImagePickerList } from '../image/image.component';
import {
  DatasourceField,
  DatasourceModel,
  datasourceModels,
  DatasourcesValue,
  DatasourceType,
  datasourceTypes,
  setDatasourceIdList,
  setDatasourceIds,
  setDatasourceType,
  toDatasourceTypes,
} from './datasource.field';

const useDatasourceLabels = () => {
  const { t } = useTranslation();

  return {
    unused: t('', 'Not used'),
    ids: t('', 'Comma separated ids'),
    id: t('', 'Id'),
    types: {
      list: t('', 'List'),
      uniqueList: t('', 'Unique list'),
      slot: t('', 'Slot'),
      single: t('', 'Single'),
      multiple: t('', 'Multiple'),
    } satisfies Record<DatasourceType, string>,
    models: {
      article: t('', 'Articles'),
      page: t('', 'Pages'),
      event: t('', 'Events'),
      image: t('', 'Images'),
      memberplan: t('', 'Member plans'),
      userSubscription: t('', 'User subscriptions'),
    } satisfies Record<DatasourceModel, string>,
  };
};

export type DatasourceFieldRenderProps = FieldProps<
  DatasourceField,
  DatasourcesValue | undefined
> & {
  name: string;
};

export const DatasourceFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: DatasourceFieldRenderProps) => {
  const labels = useDatasourceLabels();
  const models = field.models ?? datasourceModels;
  const types = field.types ?? datasourceTypes;
  const current = value ?? {};

  return (
    <FieldLabel
      label={field.label ?? 'Datasource'}
      readOnly={readOnly}
      el="div"
    >
      <FieldStack>
        {models.map(model => {
          const available = toDatasourceTypes(model, types);
          const fixedType = available.length === 1 ? available[0] : undefined;
          const base =
            current[model] || !fixedType ?
              current
            : setDatasourceType(current, model, fixedType);
          const datasource = base[model];
          const setIds = (ids: string[]) =>
            onChange(setDatasourceIdList(base, model, ids));

          const content = (
            <FieldStack>
              {!fixedType && (
                <FieldSelect
                  value={datasource?.type ?? ''}
                  disabled={readOnly}
                  onChange={event =>
                    onChange(
                      setDatasourceType(
                        current,
                        model,
                        (event.currentTarget.value || undefined) as
                          DatasourceType | undefined
                      )
                    )
                  }
                >
                  <option value="">{labels.unused}</option>

                  {available.map(type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {labels.types[type]}
                    </option>
                  ))}
                </FieldSelect>
              )}

              {model === 'image' && datasource?.type === 'single' && (
                <ImagePicker
                  value={datasource.id || undefined}
                  readOnly={readOnly}
                  onChange={id => setIds(id ? [id] : [])}
                />
              )}

              {model === 'image' && datasource?.type === 'multiple' && (
                <ImagePickerList
                  value={datasource.ids}
                  readOnly={readOnly}
                  onChange={setIds}
                />
              )}

              {model !== 'image' && datasource?.type === 'single' && (
                <FieldInput
                  type="text"
                  value={datasource.id}
                  disabled={readOnly}
                  placeholder={labels.id}
                  onChange={event =>
                    onChange(
                      setDatasourceIds(
                        current,
                        model,
                        event.currentTarget.value
                      )
                    )
                  }
                />
              )}

              {model !== 'image' && datasource?.type === 'multiple' && (
                <FieldInput
                  type="text"
                  defaultValue={datasource.ids.join(', ')}
                  disabled={readOnly}
                  placeholder={labels.ids}
                  onBlur={event =>
                    onChange(
                      setDatasourceIds(
                        current,
                        model,
                        event.currentTarget.value
                      )
                    )
                  }
                />
              )}
            </FieldStack>
          );

          return models.length === 1 ?
              <div key={model}>{content}</div>
            : <FieldLabel
                key={model}
                label={labels.models[model]}
                readOnly={readOnly}
                el="div"
              >
                {content}
              </FieldLabel>;
        })}
      </FieldStack>
    </FieldLabel>
  );
};
