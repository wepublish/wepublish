import { ComponentConfig, DefaultComponentProps } from '@puckeditor/core';

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
          },
          background: {
            label: 'Background',
            type: 'color',
          },
          textAlign: {
            type: 'alignment',
            alignments: ['left', 'center', 'right'],
          },
          border: {
            type: 'border',
            visible: false,
          },
          padding: {
            type: 'padding',
            visible: false,
          },
        },
      },
    },
    render: ({ ...props }) => {
      return <Render {...(props as Parameters<typeof Render>[0])} />;
    },
  } as ComponentConfig<{ props: WithCSS<Props>; fields: UserFields }>;
}
