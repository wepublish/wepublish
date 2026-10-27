import { ClassNames, CSSObject, Theme } from '@emotion/react';
import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';
import { createElement } from 'react';

import {
  alignmentFieldAi,
  AlignmentValue,
  borderFieldAi,
  BorderValue,
  colorFieldAi,
  ColorValue,
  paddingFieldAi,
  PaddingValue,
  resolveColor,
  sides,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type CSSValue = {
  color?: ColorValue;
  background?: ColorValue;
  textAlign?: Extract<AlignmentValue, 'left' | 'center' | 'right'>;
  border?: BorderValue;
  padding?: PaddingValue;
};

export type WithCSS<Props> = Props & { className?: string; css?: CSSValue };

const capitalize = (side: string) =>
  `${side.charAt(0).toUpperCase()}${side.slice(1)}`;

export const cssStyles = (theme: Theme, css: CSSValue = {}): CSSObject => {
  const styles: CSSObject = {};
  const color = resolveColor(theme, css.color);
  const background = resolveColor(theme, css.background);

  if (color) {
    styles.color = color;
  }

  if (background) {
    styles.background = background;
  }

  if (css.textAlign) {
    styles.textAlign = css.textAlign;
  }

  const borderColor = resolveColor(theme, css.border?.color) ?? 'currentColor';

  for (const side of sides) {
    const width = css.border?.width?.[side];

    if (width) {
      styles[`border${capitalize(side)}`] =
        `${width}px ${css.border?.style ?? 'solid'} ${borderColor}`;
    }
  }

  for (const side of sides) {
    const padding = css.padding?.[side];

    if (padding !== undefined) {
      styles[`padding${capitalize(side)}`] = `${padding}px`;
    }
  }

  return styles;
};

export function withCSS<
  Props extends DefaultComponentProps & { className?: string },
>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>
): ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }> {
  const Render = config.render;

  return {
    ...config,
    fields: {
      ...config.fields,
      css: {
        label: 'Styling',
        type: 'object',
        objectFields: {
          color: {
            label: 'Foreground',
            type: 'color',
            ai: {
              ...colorFieldAi(),
              instructions: `Text colour of the component. ${colorFieldAi().instructions}`,
            },
          },
          background: {
            label: 'Background',
            type: 'color',
            ai: {
              ...colorFieldAi(),
              instructions: `Background colour of the component. ${colorFieldAi().instructions}`,
            },
          },
          textAlign: {
            label: 'Text align',
            type: 'alignment',
            orientation: 'text',
            alignments: ['left', 'center', 'right'],
            ai: alignmentFieldAi(['left', 'center', 'right'], 'text'),
          },
          padding: {
            label: 'Padding',
            type: 'padding',
            ai: paddingFieldAi,
          },
          border: {
            label: 'Border',
            type: 'border',
            ai: borderFieldAi,
          },
        },
      },
    },
    render: ({ css: cssValue, className, ...props }) => (
      <ClassNames>
        {({ css, cx, theme }) =>
          createElement(Render, {
            ...props,
            className: cx(className, css(cssStyles(theme, cssValue))),
          } as Parameters<typeof Render>[0])
        }
      </ClassNames>
    ),
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
