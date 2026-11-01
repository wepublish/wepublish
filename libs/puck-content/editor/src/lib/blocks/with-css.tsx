import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';
import { createElement } from 'react';
import { Side } from '@wepublish/puck-content/website';

import {
  BreakpointStylingValue,
  StylingGroup,
  stylingFieldAi,
} from '../styling/styling.field';
import { UserFields } from '../fields';
import { CSSRender } from './css-render.component';

export type CSSValue = BreakpointStylingValue;

export type WithCSS<Props> = Props & {
  className?: string;
  styling?: CSSValue;
};

export function withCSS<
  Props extends DefaultComponentProps & { className?: string },
>(
  config: ComponentConfig<{ props: Props; fields: UserFields }>,
  {
    marginSides,
    groups,
  }: { marginSides?: Side[]; groups?: StylingGroup[] } = {}
): ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }> {
  const Render = config.render;

  return {
    ...config,
    fields: {
      ...config.fields,
      styling: {
        label: 'Styling',
        type: 'styling',
        marginSides,
        groups,
        ai: stylingFieldAi(marginSides, groups),
      },
    },
    render: ({ styling, className, ...props }) => (
      <CSSRender
        styling={styling}
        marginSides={marginSides}
        className={className}
      >
        {styledClassName =>
          createElement(Render, {
            ...props,
            className: styledClassName,
          } as Parameters<typeof Render>[0])
        }
      </CSSRender>
    ),
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
