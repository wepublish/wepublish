import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

import {
  alignmentFieldAi,
  borderFieldAi,
  colorFieldAi,
  paddingFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export type WithCSS<Props> = Props & { className?: string };

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
              ...colorFieldAi,
              instructions: `Text colour of the component. ${colorFieldAi.instructions}`,
            },
          },
          background: {
            label: 'Background',
            type: 'color',
            ai: {
              ...colorFieldAi,
              instructions: `Background colour of the component. ${colorFieldAi.instructions}`,
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
    render: ({ ...props }) => {
      return <Render {...(props as Parameters<typeof Render>[0])} />;
    },
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
