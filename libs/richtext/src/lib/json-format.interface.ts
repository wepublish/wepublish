import { MarkType } from '@tiptap/core';

type Bold = MarkType<'bold'>;
type Italic = MarkType<'italic'>;
type Underline = MarkType<'underline'>;
type Strike = MarkType<'strike'>;
type Subscript = MarkType<'subscript'>;
type Superscript = MarkType<'superscript'>;
type Link = MarkType<
  'link',
  {
    href: string;
    target?: string;
    rel?: string;
    id?: string;
  }
>;
type TextStyle = MarkType<
  'textStyle',
  {
    backgroundColor?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
  }
>;

export type RichtextMarks =
  | Bold
  | Italic
  | Underline
  | Strike
  | Subscript
  | Superscript
  | Link
  | TextStyle;

type RichtextNode<Type extends string, Attrs = undefined, Content = void> = {
  type: Type;
  attrs: Attrs;
  marks?: RichtextMarks[];
} & (Content extends void ? unknown : { content?: Content });

export type Text = RichtextNode<'text', undefined> & {
  text: string;
};
type Paragraph = RichtextNode<
  'paragraph',
  { textAlign?: 'left' | 'right' | 'center' | null },
  Text[]
>;
type Heading = RichtextNode<
  'heading',
  { level: 1 | 2 | 3 | 4 | 5 | 6; id?: string | null } & Paragraph['attrs'],
  Text[]
>;
type HardBreak = RichtextNode<'hardBreak', undefined>;
type Blockquote = RichtextNode<'blockquote', undefined, RichtextElements[]>;
type Codeblock = RichtextNode<'codeBlock', { language: string }, Text[]>;
type Image = RichtextNode<
  'image',
  {
    src?: HTMLImageElement['src'];
    title?: HTMLImageElement['title'];
    alt?: HTMLImageElement['alt'];
  }
>;

type TableHeader = RichtextNode<
  'tableHeader',
  {
    colspan: number;
    rowspan: number;
    colwidth: number[] | null;
    borderColor: string;
  },
  RichtextElements[]
>;
type TableCell = RichtextNode<
  'tableCell',
  {
    colspan: number;
    rowspan: number;
    colwidth: number[] | null;
    borderColor?: string | null;
  },
  RichtextElements[]
>;
type TableRow = RichtextNode<
  'tableRow',
  undefined,
  Array<TableHeader | TableCell>
>;
type Table = RichtextNode<'table', undefined, TableRow[]>;
export type RichtextTableElements = Table | TableRow | TableHeader | TableCell;

type ListItem = RichtextNode<'listItem', undefined, RichtextElements[]>;
type BulletList = RichtextNode<'bulletList', undefined, ListItem[]>;
type OrderedList = RichtextNode<
  'orderedList',
  { start: number; type?: string | null },
  ListItem[]
>;
export type RichtextListElements = ListItem | BulletList | OrderedList;

export type RichtextElements =
  | Heading
  | Paragraph
  | HardBreak
  | Text
  | Image
  | Blockquote
  | Codeblock
  | RichtextListElements
  | RichtextTableElements;

export type RichtextJSONDocument = RichtextNode<
  'doc',
  undefined,
  RichtextElements[]
>;
