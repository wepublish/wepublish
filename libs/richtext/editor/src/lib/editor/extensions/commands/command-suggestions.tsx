import { ReactRenderer } from '@tiptap/react';

import { CommandList } from './command-list';
import { CommandItem, CommandOptions } from '../commands';
import { SuggestionKeyDownProps } from '@tiptap/suggestion';

export const commandSuggestions = {
  items: ({ query }) =>
    (
      [
        {
          title: 'Heading 1',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode('heading', { level: 1 })
              .run();
          },
        },
        {
          title: 'Heading 2',
          command: ({ editor, range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode('heading', { level: 2 })
              .run();
          },
        },
        {
          title: 'Bold',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setMark('bold').run();
          },
        },
        {
          title: 'Italic',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setMark('italic').run();
          },
        },
        {
          title: 'Table',
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
          title: 'Quote',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setBlockquote().run();
          },
        },
        {
          title: 'Code',
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setCodeBlock().run();
          },
        },
      ] as CommandItem[]
    )
      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10),

  render: () => {
    let component: ReactRenderer<{
      onKeyDown?: (props: SuggestionKeyDownProps) => any;
    }>;

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
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          component.element.remove();

          return true;
        }

        return component.ref?.onKeyDown?.(props);
      },

      onExit() {
        component.destroy();
        component.element.remove();
      },
    };
  },
} satisfies Pick<CommandOptions, 'items' | 'render'>;

export type CommandSuggestion = typeof commandSuggestions;
