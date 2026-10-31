import {
  ComponentConfig,
  DefaultComponentProps,
  PuckComponent,
} from '@puckeditor/core';

import {
  DatasourceField,
  datasourceFieldAi,
  DatasourcesValue,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../types';

export type WithDataSource<Props> = Props & {
  datasources?: DatasourcesValue;
};

export type DatasourceSettings = Omit<DatasourceField, 'type' | 'ai'>;

export const datasourceField = (
  settings: DatasourceSettings = {}
): DatasourceField => ({
  ...settings,
  type: 'datasource',
  ai: datasourceFieldAi(settings.types, settings.models),
});

export function withDataSource<Props extends DefaultComponentProps>(
  config: Omit<
    ComponentConfig<{
      props: Omit<Props, 'datasources'>;
      fields: UserFields;
    }>,
    'render'
  > & { render: PuckComponent<WithDataSource<Props>> },
  defaultDatasources?: DatasourcesValue,
  settings?: DatasourceSettings
): ComponentConfig<{ props: WithDataSource<Props>; fields: UserFields }> {
  return {
    ...config,
    fields: {
      ...config.fields,
      datasources: datasourceField(settings),
    },
    ...(defaultDatasources && {
      defaultProps: { ...config.defaultProps, datasources: defaultDatasources },
    }),
  } as ComponentConfig<{ props: WithDataSource<Props>; fields: UserFields }>;
}

export function withImageDataSource<Props extends DefaultComponentProps>(
  config: Parameters<typeof withDataSource<Props>>[0]
) {
  return withDataSource<Props>(
    config,
    { image: { type: 'single', id: '' } },
    { models: ['image'], types: ['single'], label: 'Image' }
  );
}
