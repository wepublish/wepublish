import { ClassNames, CSSObject, Theme } from '@emotion/react';
import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';
import { createElement } from 'react';

import {
  resolveColor,
  Side,
  sides,
  spacingToCss,
  stylingFieldAi,
  StylingValue,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type CSSValue = StylingValue;

export type WithCSS<Props> = Props & { className?: string; css?: CSSValue };

const capitalize = (side: string) =>
  `${side.charAt(0).toUpperCase()}${side.slice(1)}`;

export const cssStyles = (
  theme: Theme,
  css: CSSValue = {},
  marginSides: Side[] = sides
): CSSObject => {
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
        `${typeof width === 'number' ? `${width}px` : width} ${css.border?.style ?? 'solid'} ${borderColor}`;
    }
  }

  for (const side of marginSides) {
    const margin = css.margin?.[side];

    if (margin !== undefined) {
      styles[`margin${capitalize(side)}`] = spacingToCss(theme, margin);
    }
  }

  for (const side of sides) {
    const padding = css.padding?.[side];

    if (padding !== undefined) {
      styles[`padding${capitalize(side)}`] = spacingToCss(theme, padding);
    }
  }

  return styles;
};

export function withCSS<
  Props extends DefaultComponentProps & { className?: string },
>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>,
  { marginSides }: { marginSides?: Side[] } = {}
): ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }> {
  const Render = config.render;

  return {
    ...config,
    fields: {
      ...config.fields,
      css: {
        label: 'Styling',
        type: 'styling',
        marginSides,
        ai: stylingFieldAi(marginSides),
      },
    },
    render: ({ css: cssValue, className, ...props }) => (
      <ClassNames>
        {({ css, cx, theme }) =>
          createElement(Render, {
            ...props,
            className: cx(
              className,
              css(cssStyles(theme, cssValue, marginSides))
            ),
          } as Parameters<typeof Render>[0])
        }
      </ClassNames>
    ),
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
