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

export function withDataSource<Props extends DefaultComponentProps>(
  config: Omit<
    ComponentConfig<{
      props: Omit<Props, 'datasources'>;
      fields: UserFields;
    }>,
    'render'
  > & { render: PuckComponent<WithDataSource<Props>> },
  defaultProps?: DatasourcesValue,
  settings?: Omit<DatasourceField, 'type' | 'ai'>
): ComponentConfig<{ props: WithDataSource<Props>; fields: UserFields }> {
  const baseResolveFields = config.resolveFields;
  const baseResolveData = config.resolveData;

  return {
    ...config,
    resolveFields: async (data, params) => {
      let fields =
        baseResolveFields ?
          await baseResolveFields(
            data as Parameters<typeof baseResolveFields>[0],
            params as Parameters<typeof baseResolveFields>[1]
          )
        : params.fields;

      fields = {
        ...fields,
        datasources: {
          type: 'datasource',
          ai: datasourceFieldAi(settings?.types, settings?.models),
          ...(settings ?? {}),
        } as DatasourceField,
      };

      return fields;
    },
    resolveData: async (data, params) => {
      const resolved =
        baseResolveData ?
          await baseResolveData(
            data as Parameters<typeof baseResolveData>[0],
            params as Parameters<typeof baseResolveData>[1]
          )
        : data;

      const props = { ...((resolved.props ?? {}) as Record<string, unknown>) };

      if (!props.datasources) {
        props.datasources = defaultProps ?? {};
      }

      return { ...resolved, props };
    },
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
