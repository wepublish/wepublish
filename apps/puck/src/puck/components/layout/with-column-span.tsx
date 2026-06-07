import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

import { UserFields } from '../../types';

export type WithColumnSpan<Props> = Props & {
  columnSpan?: number;
  rowSpan?: number;
};

const isInFlex = (parent: { type?: string } | null | undefined) => {
  return parent?.type === 'Flex';
};

export function withColumnSpan<Props extends DefaultComponentProps>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>
): ComponentConfig<{ props: WithColumnSpan<Props>; fields: UserFields }> {
  const Render = config.render;
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

      if (isInFlex(params.parent)) {
        fields = {
          ...fields,
          columnSpan: {
            type: 'number',
            label: 'Column span',
            min: 1,
            max: 12,
          },
          rowSpan: {
            type: 'number',
            label: 'Row span',
            min: 1,
            max: 12,
          },
        };
      }

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

      let props = { ...((resolved.props ?? {}) as Record<string, unknown>) };

      if (isInFlex(params.parent)) {
        props = {
          ...props,
          columnSpan: props.columnSpan ?? 6,
          rowSpan: props.rowSpan ?? 1,
        };
      } else {
        props.columnSpan = undefined;
        props.rowSpan = undefined;
      }

      return { ...resolved, props };
    },
    render: ({ columnSpan, rowSpan, ...props }) => (
      <div
        ref={props.puck.dragRef}
        style={{
          gridColumn: columnSpan ? `span ${columnSpan}` : undefined,
          gridRow: rowSpan ? `span ${rowSpan}` : undefined,
        }}
      >
        <Render {...(props as Parameters<typeof Render>[0])} />
      </div>
    ),
  } as ComponentConfig<{ props: WithColumnSpan<Props>; fields: UserFields }>;
}
