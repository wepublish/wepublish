import { Editor, Extension, Range } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export type CommandItem = {
  title: string;
  command: (props: { editor: Editor; range: Range }) => void;
};

export type CommandOptions = SuggestionOptions<CommandItem, CommandItem>;

export const Commands = Extension.create({
  name: 'commandList',

  addOptions() {
    return {
      suggestions: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      } satisfies Pick<CommandOptions, 'char' | 'command'>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestions,
      }),
    ];
  },
});
