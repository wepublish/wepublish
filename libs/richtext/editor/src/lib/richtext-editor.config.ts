import { TextStyleKit } from '@tiptap/extension-text-style';
import { UseEditorOptions } from '@tiptap/react';
import { ListKit } from '@tiptap/extension-list';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { Placeholder } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { TableKit } from '@tiptap/extension-table';
import i18next from 'i18next';
import { Commands } from './editor/extensions/commands';
import { commandSuggestions } from './editor/extensions/commands/command-suggestions';
import { InvisibleCharacters } from './editor/extensions/invisible-characters';
import { HeadingId } from './editor/extensions/heading-id';
import { LinkVariant } from './editor/extensions/link-variant';
import { TableCellWithBorder, TableHeaderWithBorder } from './editor/table';
import { SmilieReplacer } from './editor/extensions/emoji';

const extensions = [
  TextStyleKit.configure({
    fontSize: false,
    fontFamily: false,
    lineHeight: false,
  }),
  StarterKit.configure({
    trailingNode: {
      node: 'paragraph',
    },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https', 'mailto'],
    },
    orderedList: false,
    bulletList: false,
    listItem: false,
    listKeymap: false,
  }),
  ListKit.configure({
    taskList: false,
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Superscript,
  Subscript,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Typography.configure(),
  TableKit.configure({
    table: { resizable: true },
    tableCell: false,
    tableHeader: false,
  }),
  InvisibleCharacters.configure({
    visible: false,
  }),
  Placeholder.configure({
    placeholder: ({ node, editor }) => {
      let prefix = ``;
      let content = ``;

      if (editor.storage.invisibleCharacters.visibility()) {
        // Fixes overlapping issue when invisible characters are shown
        prefix = '\t';
      }

      if (node.type.name === 'heading') {
        content = i18next.t('richtext.placeholder.heading');
      }

      if (node.type.name === 'paragraph') {
        content = i18next.t('richtext.placeholder.paragraph');
      }

      return prefix + content;
    },
  }),
  HeadingId.configure({
    types: ['heading'],
  }),
  // We.Publish Extensions
  SmilieReplacer,
  Commands.configure({
    suggestions: commandSuggestions,
  }),
  TableCellWithBorder,
  TableHeaderWithBorder,
  LinkVariant.configure({
    variants: [
      { value: 'buttonLinkMain', label: 'Button (Main)' },
      { value: 'buttonLinkSecondary', label: 'Button (Secondary)' },
    ],
  }),
];

export const editorConfig: UseEditorOptions = {
  extensions,
  // Performance
  immediatelyRender: true,
  shouldRerenderOnTransaction: false,
};
