import { ClassNames, CSSObject, Theme } from '@emotion/react';
import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

import {
  alignmentFieldAi,
  AlignmentValue,
  borderFieldAi,
  borderSides,
  BorderValue,
  colorFieldAi,
  ColorValue,
  paddingFieldAi,
  PaddingValue,
  resolveColor,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type CSSValue = {
  color?: ColorValue;
  background?: ColorValue;
  textAlign?: AlignmentValue;
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

  for (const side of borderSides) {
    const border = css.border?.[side];

    if (border?.width) {
      styles[`border${capitalize(side)}`] =
        `${border.width}px ${border.style ?? 'solid'} currentColor`;
    }
  }

  for (const side of borderSides) {
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
            type: 'alignment',
            alignments: ['left', 'center', 'right'],
            ai: alignmentFieldAi(['left', 'center', 'right']),
          },
          border: {
            type: 'border',
            visible: false,
            ai: borderFieldAi,
          },
          padding: {
            type: 'padding',
            visible: false,
            ai: paddingFieldAi,
          },
        },
      },
    },
    render: ({ css: cssValue, className, ...props }) => (
      <ClassNames>
        {({ css, cx, theme }) => (
          <Render
            {...(props as Parameters<typeof Render>[0])}
            className={cx(className, css(cssStyles(theme, cssValue)))}
          />
        )}
      </ClassNames>
    ),
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
