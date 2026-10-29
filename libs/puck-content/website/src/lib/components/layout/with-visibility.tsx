import { ClassNames, CSSObject, Theme } from '@emotion/react';
import {
  ComponentConfig,
  DefaultComponentProps,
  PuckContext,
} from '@puckeditor/core';
import { createElement } from 'react';

import {
  blockVisibilityFieldAi,
  BlockVisibilityValue,
  isHiddenOn,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type WithVisibility<Props> = Props & {
  className?: string;
  visibility?: BlockVisibilityValue;
};

export const isBlockRendered = (
  visibility: BlockVisibilityValue | undefined,
  isEditing: boolean
) => isEditing || !visibility?.disabled;

export const visibilityStyles =
  (visibility: BlockVisibilityValue | undefined, isEditing = false) =>
  (theme: Theme): CSSObject => ({
    ...(isEditing && visibility?.disabled ? { opacity: 0.4 } : {}),
    ...Object.fromEntries(
      theme.breakpoints.keys
        .filter(breakpoint => isHiddenOn(visibility?.breakpoints, breakpoint))
        .map(breakpoint => [
          theme.breakpoints.only(breakpoint),
          { display: 'none' },
        ])
    ),
  });

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
        type: 'blockVisibility',
        label: 'Visibility',
        ai: blockVisibilityFieldAi,
      },
    },
    render: ({ visibility, className, ...props }) => {
      const isEditing = !!(props as { puck?: PuckContext }).puck?.isEditing;

      if (!isBlockRendered(visibility, isEditing)) {
        return null;
      }

      return (
        <ClassNames>
          {({ css, cx, theme }) =>
            createElement(Render, {
              ...props,
              className: cx(
                className,
                css(visibilityStyles(visibility, isEditing)(theme))
              ),
            } as Parameters<typeof Render>[0])
          }
        </ClassNames>
      );
    },
  } as ComponentConfig<{ props: WithVisibility<Props>; fields: UserFields }>;
}
