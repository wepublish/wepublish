import { TextFormat } from './lib/text-format';
import { BlockFormat } from './lib/block-format';
import { BaseElement, BaseText } from 'slate';
import { InlineFormat } from './lib/inline-format';
import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

type CustomText = BaseText & { [k in TextFormat]?: true };
type CustomElement = BaseElement & {
  type: BlockFormat | InlineFormat;
  borderColor?: string;
  title?: string;
  id?: string;
  url?: string;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

export * from './lib/truncate';
export * from './lib/to-plaintext';
export * from './lib/to-html';

export * from './lib/block-format';
export * from './lib/inline-format';
export * from './lib/text-format';
