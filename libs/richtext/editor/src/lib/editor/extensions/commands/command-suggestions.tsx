import { ReactRenderer } from '@tiptap/react';
import i18next from 'i18next';

import { CommandList } from './command-list';
import { CommandItem, CommandOptions } from '../commands';
import { SuggestionKeyDownProps } from '@tiptap/suggestion';

/**
 * The slash commands every editor ships with.
 *
 * This is a function and not a constant because the titles are translated:
 * `i18next.t` has to run when the list is requested, not when this module is
 * first imported, or the titles keep the language that happened to be active
 * at import time.
 */
const builtInCommandItems = (): CommandItem[] => [
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
];

/**
 * Builds the slash command suggestions, optionally extended by items an
 * integration contributes through the editor configuration.
 *
 * The built-in items always come first and cannot be removed or shadowed by
 * an additional item, so an integration can never take away a command a
 * writer relies on. Filtering and the limit of ten apply to the combined
 * list.
 */
/**
 * Where contributed slash commands come from: a fixed list, or a function that
 * is asked every time the list is requested. The function form lets a
 * component change the contributed commands without rebuilding the editor.
 */
export type CommandItemsSource = CommandItem[] | (() => CommandItem[]);

const resolveItems = (source: CommandItemsSource): CommandItem[] =>
  typeof source === 'function' ? source() : source;

export const createCommandSuggestions = (
  additionalItems: CommandItemsSource = []
) =>
  ({
    items: ({ query }) =>
      [...builtInCommandItems(), ...resolveItems(additionalItems)]
        .filter(item =>
          item.title.toLowerCase().startsWith(query.toLowerCase())
        )
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
  }) satisfies Pick<CommandOptions, 'items' | 'render'>;

export const commandSuggestions = createCommandSuggestions();

export type CommandSuggestion = typeof commandSuggestions;
