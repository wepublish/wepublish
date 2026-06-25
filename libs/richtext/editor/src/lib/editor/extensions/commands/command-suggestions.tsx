import { ReactRenderer } from '@tiptap/react';
import i18next from 'i18next';

import { CommandList } from './command-list';
import { CommandItem, CommandOptions } from '../commands';
import { SuggestionKeyDownProps } from '@tiptap/suggestion';

export const commandSuggestions = {
  items: ({ query }) =>
    (
      [
        {
          title: i18next.t('richtext.commands.table'),
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
          },
        },
        {
          title: i18next.t('richtext.commands.quote'),
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setBlockquote().run();
          },
        },
        {
          title: i18next.t('richtext.commands.code'),
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setCodeBlock().run();
          },
        },
      ] as CommandItem[]
    )
      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10),

  render: () => {
    let component:
      | ReactRenderer<{
          onKeyDown?: (props: SuggestionKeyDownProps) => any;
        }>
      | undefined;

    return {
      onStart: props => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }
      },

      onUpdate(props) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component?.destroy();
          component?.element.remove();

          return true;
        }

        return component?.ref?.onKeyDown?.(props);
      },

      onExit() {
        component?.destroy();
        component?.element.remove();
      },
    };
  },
} satisfies Pick<CommandOptions, 'items' | 'render'>;

export type CommandSuggestion = typeof commandSuggestions;
