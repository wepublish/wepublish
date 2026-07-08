import InvisibleCharacters from '@tiptap/extension-invisible-characters';

export interface InvisibleCharactersStorage {
  /**
   * Get whether the invisible characters are shown or not
   */
  visibility: () => boolean;
}

declare module '@tiptap/core' {
  interface Storage {
    invisibleCharacters: InvisibleCharactersStorage;
  }
}

export { InvisibleCharacters };
