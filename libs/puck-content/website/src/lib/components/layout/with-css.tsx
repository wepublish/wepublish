import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';
import { createElement } from 'react';

import { Side, stylingFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { CSSRender } from './css-render.component';
import { CSSValue } from './css-styles';

export { cssStyles } from './css-styles';
export type { CSSValue } from './css-styles';

export type WithCSS<Props> = Props & {
  className?: string;
  styling?: CSSValue;
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
      styling: {
        label: 'Styling',
        type: 'styling',
        marginSides,
        ai: stylingFieldAi(marginSides),
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
