import {
  ComponentConfig,
  DefaultComponentProps,
  ObjectField,
} from '@puckeditor/core';
import { colorField } from '../fields/color';
import { ComponentProps, memo, useMemo } from 'react';

type ColorFieldProps = {
  background?: string;
  forground?: string;
};

export type WithColor<Props extends DefaultComponentProps> = Props & {
  color?: ColorFieldProps;
};

export const colorFields: ObjectField<ColorFieldProps> = {
  type: 'object',
  objectFields: {
    background: {
      ...colorField,
      label: 'Background Color',
    },
    forground: {
      ...colorField,
      label: 'Forground Color',
    },
  },
};

export function withColor<
  ThisComponentConfig extends ComponentConfig<any> = ComponentConfig,
>(componentConfig: ThisComponentConfig) {
  const Render = componentConfig.render;

  return {
    ...componentConfig,
    fields: {
      ...componentConfig.fields,
      color: colorFields,
    },
    defaultProps: {
      ...componentConfig.defaultProps,
      color: {},
    },
    render: memo<
      ComponentProps<ThisComponentConfig['render']> & {
        color: { background?: string; forground?: string };
      }
    >(function Color(props) {
      const style = useMemo(
        () => ({
          ...props.style,
          backgroundColor: props.color.background,
          color: props.color.forground,
        }),
        [props.color.background, props.color.forground, props.style]
      );

      return (
        <Render
          {...props}
          style={style}
        />
      );
    }),
  };
}
