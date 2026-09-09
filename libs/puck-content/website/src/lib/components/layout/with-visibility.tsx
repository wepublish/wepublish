import { CSSObject, Theme } from '@emotion/react';
import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

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
    render: ({ visibility, ...props }) => (
      <Render
        {...(props as Parameters<typeof Render>[0])}
        css={visibilityStyles(visibility)}
      />
    ),
  } as ComponentConfig<{ props: WithVisibility<Props>; fields: UserFields }>;
}
