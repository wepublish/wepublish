import { ClassNames, CSSObject, Theme } from '@emotion/react';
import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';
import { createElement } from 'react';

import {
  isHiddenOn,
  visibilityFieldAi,
  VisibilityValue,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type WithVisibility<Props> = Props & {
  className?: string;
  visibility?: VisibilityValue;
};

export const visibilityStyles =
  (visibility: VisibilityValue | undefined) =>
  (theme: Theme): CSSObject =>
    Object.fromEntries(
      theme.breakpoints.keys
        .filter(breakpoint => isHiddenOn(visibility, breakpoint))
        .map(breakpoint => [
          theme.breakpoints.only(breakpoint),
          { display: 'none' },
        ])
    );

export function withVisibility<
  Props extends DefaultComponentProps & { className?: string },
>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>
): ComponentConfig<{ props: WithVisibility<Props>; fields: UserFields }> {
  const Render = config.render;

  return {
    ...config,
    fields: {
      ...config.fields,
      visibility: {
        type: 'visibility',
        label: 'Visibility',
        ai: visibilityFieldAi(),
      },
    },
    render: ({ visibility, className, ...props }) => (
      <ClassNames>
        {({ css, cx, theme }) =>
          createElement(Render, {
            ...props,
            className: cx(className, css(visibilityStyles(visibility)(theme))),
          } as Parameters<typeof Render>[0])
        }
      </ClassNames>
    ),
  } as ComponentConfig<{ props: WithVisibility<Props>; fields: UserFields }>;
}
