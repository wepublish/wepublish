import {
  ComponentConfig,
  DefaultComponentProps,
  ObjectField,
} from '@measured/puck';
import { CSSProperties, forwardRef, memo, ReactNode, useMemo } from 'react';
import { spacingOptions } from '../options/spacing-options';

type LayoutFieldProps = {
  vertPadding?: string;
  horPadding?: string;
  spanCol?: number;
  spanRow?: number;
};

export type WithLayout<Props extends DefaultComponentProps> = Props & {
  layout?: LayoutFieldProps;
};

type LayoutProps = WithLayout<{
  children: ReactNode;
  style?: CSSProperties;
}>;

export const layoutField: ObjectField<LayoutFieldProps> = {
  type: 'object',
  objectFields: {
    spanCol: {
      label: 'Grid Columns',
      type: 'number',
      min: 1,
      max: 12,
    },
    spanRow: {
      label: 'Grid Rows',
      type: 'number',
      min: 1,
      max: 12,
    },
    vertPadding: {
      type: 'select',
      label: 'Vertical Padding',
      options: [{ label: '0px', value: '0px' }, ...spacingOptions],
    },
    horPadding: {
      type: 'select',
      label: 'Horizontal Padding',
      options: [{ label: '0px', value: '0px' }, ...spacingOptions],
    },
  },
};

export const Layout = forwardRef<HTMLDivElement, LayoutProps>(function Layout(
  { children, layout, style },
  ref
) {
  return (
    <div
      style={{
        gridColumn:
          layout?.spanCol ?
            `span ${Math.max(Math.min(layout.spanCol, 12), 1)}`
          : undefined,
        gridRow:
          layout?.spanRow ?
            `span ${Math.max(Math.min(layout.spanRow, 12), 1)}`
          : undefined,
        ...style,
      }}
      ref={ref}
    >
      {children}
    </div>
  );
});

export function withLayout<
  ThisComponentConfig extends ComponentConfig<any> = ComponentConfig,
>(componentConfig: ThisComponentConfig): ThisComponentConfig {
  const Render = componentConfig.render;

  return {
    ...componentConfig,
    fields: {
      ...componentConfig.fields,
      layout: layoutField,
    },
    defaultProps: {
      ...componentConfig.defaultProps,
      layout: {
        spanCol: 1,
        spanRow: 1,
        vertPadding: spacingOptions[1].value,
        horPadding: spacingOptions[1].value,
        ...componentConfig.defaultProps?.layout,
      },
    },
    resolveFields: (data, params) => {
      const defaultFields = {
        ...(componentConfig.resolveFields?.(data, params) ??
          componentConfig.fields),
      };

      if (params.parent?.type === 'Grid') {
        return {
          ...defaultFields,
          layout: {
            ...layoutField,
            objectFields: {
              spanCol: layoutField.objectFields.spanCol,
              spanRow: layoutField.objectFields.spanRow,
              vertPadding: layoutField.objectFields.vertPadding,
              horPadding: layoutField.objectFields.horPadding,
            },
          },
        };
      }

      return {
        ...defaultFields,
        layout: {
          ...layoutField,
          objectFields: {
            vertPadding: layoutField.objectFields.vertPadding,
            horPadding: layoutField.objectFields.horPadding,
          },
        },
      };
    },
    inline: true,
    render: memo(function Rend(props) {
      const style = useMemo(
        () => ({
          ...props.style,
          padding: `${props.layout?.vertPadding} ${props.layout?.horPadding}`,
        }),
        [props.layout?.horPadding, props.layout?.vertPadding, props.style]
      );

      return (
        <Layout
          layout={props.layout as LayoutFieldProps}
          ref={props.puck.dragRef}
        >
          <Render
            {...props}
            style={style}
          />
        </Layout>
      );
    }),
  };
}
