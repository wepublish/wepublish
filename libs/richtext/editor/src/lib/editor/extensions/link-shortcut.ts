import { Editor, Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface EditorEvents {
    openLinkMenu: { editor: Editor };
  }
}

export const LinkShortcut = Extension.create({
  name: 'linkShortcut',

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        if (!this.editor.isEditable) {
          return false;
        }

        this.editor.emit('openLinkMenu', { editor: this.editor });

        return true;
      },
    };
  },
});
