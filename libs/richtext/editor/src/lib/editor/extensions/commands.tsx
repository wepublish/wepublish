import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const Commands = Extension.create({
  name: 'commands',

  addOptions() {
    return {
      suggestions: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
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
