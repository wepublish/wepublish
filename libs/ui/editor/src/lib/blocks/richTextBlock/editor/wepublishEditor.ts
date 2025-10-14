import { BlockFormat, TextFormat } from '@wepublish/richtext';
import { toArray } from 'lodash';
import { Editor, Element, Node, Transforms } from 'slate';

import { RichTextBlockValue } from '../../types';
import { emptyTextParagraph } from './elements';
import {
  BlockFormats,
  Format,
  InlineFormats,
  ListFormats,
  TextFormats,
} from './formats';

export const WepublishEditor = {
  // Extending the Editor according docs: https://docs.slatejs.org/concepts/07-plugins#helper-functions
  ...Editor,

  isFormatActive(editor: Editor, format: Format) {
    if (TextFormats.includes(format)) {
      const marks = this.marks(editor);

      return marks?.[format as TextFormat];
    }

    if (BlockFormats.includes(format) || InlineFormats.includes(format)) {
      const [match] = this.nodes(editor, {
        match: node => Element.isElement(node) && node.type === format,
        mode: 'all',
      });

      return !!match;
    }

    return false;
  },

  toggleFormat(editor: Editor, format: Format) {
    const isActive = this.isFormatActive(editor, format);
    const isList = ListFormats.includes(format);

    if (TextFormats.includes(format)) {
      if (isActive) {
        editor.removeMark(format);
      } else {
        editor.addMark(format, true);
      }
    }

    if (BlockFormats.includes(format)) {
      for (const format of ListFormats) {
        Transforms.unwrapNodes(editor, {
          match: node => Element.isElement(node) && node.type === format,
          split: true,
        });
      }

      Transforms.setNodes(editor, {
        type:
          isActive ? BlockFormat.Paragraph
          : isList ? BlockFormat.ListItem
          : (format as BlockFormat),
      });

      if (!isActive && isList) {
        Transforms.wrapNodes(editor, {
          type: format as BlockFormat,
          children: [],
        });
      }
    }
  },

  createDefaultValue(): RichTextBlockValue['richText'] {
    return [emptyTextParagraph()];
  },

  isEmpty(editor: Editor) {
    return (
      JSON.stringify(editor.children) ===
      JSON.stringify(this.createDefaultValue())
    );
  },

  calculateEditorCharCount(editor: Editor) {
    // using lodash toArray to get correct length for characters like emojis
    return toArray(this.getTextString(editor)).length;
  },

  getTextString(editor: Editor) {
    // get all text nodes and append them to each other in one string
    return [...Node.texts(editor)].reduce((string, nodePair, index) => {
      const [textNode] = nodePair;
      if (index === 0) return `${textNode.text}`;
      return `${string} ${textNode.text}`;
    }, '');
  },
};
