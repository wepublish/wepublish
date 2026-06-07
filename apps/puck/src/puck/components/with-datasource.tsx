import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

import { DatasourceField, DatasourceValue } from '../plugins/datasource';
import { UserFields } from '../types';

export type WithDataSource<Props> = Props & {
  datasource: DatasourceValue;
};

export function withDataSource<Props extends DefaultComponentProps>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>,
  defaultProps?: DatasourceValue,
  settings?: Omit<DatasourceField, 'type' | 'ai'>
): ComponentConfig<{ props: WithDataSource<Props>; fields: UserFields }> {
  const baseResolveFields = config.resolveFields;
  const baseResolveData = config.resolveData;

  return {
    ...config,
    inline: true,
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
        datasource: {
          type: 'datasource',
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

      if (!props.datasource) {
        props.datasource = defaultProps;
      }

      return { ...resolved, props };
    },
  } as ComponentConfig<{ props: WithDataSource<Props>; fields: UserFields }>;
}
