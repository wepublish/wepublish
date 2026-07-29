import { MarkType, NodeType } from '@tiptap/core';

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

export type Text = NodeType<'text', undefined, any, RichtextMarks[]> & {
  text: string;
};
type Paragraph = NodeType<
  'paragraph',
  { textAlign?: 'left' | 'right' | 'center' | null },
  any,
  Text[]
>;
type Heading = NodeType<
  'heading',
  { level: 1 | 2 | 3 | 4 | 5 | 6; id?: string | null } & Paragraph['attrs']
>;
type HardBreak = NodeType<'hardBreak', undefined>;
type Blockquote = NodeType<'blockquote', undefined>;
type Codeblock = NodeType<'codeBlock', { language: string }>;
type Image = NodeType<
  'image',
  {
    src?: HTMLImageElement['src'];
    title?: HTMLImageElement['title'];
    alt?: HTMLImageElement['alt'];
  }
>;

type TableHeader = NodeType<
  'tableHeader',
  {
    colspan: number;
    rowspan: number;
    colwidth: number[] | null;
    borderColor: string;
  }
>;
type TableCell = NodeType<
  'tableCell',
  {
    colspan: number;
    rowspan: number;
    colwidth: number[] | null;
    borderColor?: string | null;
  }
>;
type TableRow = NodeType<
  'tableRow',
  undefined,
  any,
  Array<TableHeader | TableCell>
>;
type Table = NodeType<'table', undefined, any, TableRow[]>;
export type RichtextTableElements = Table | TableRow | TableHeader | TableCell;

type ListItem = NodeType<'listItem', undefined>;
type BulletList = NodeType<'bulletList', undefined, any, ListItem[]>;
type OrderedList = NodeType<
  'orderedList',
  { start: number; type?: string | null },
  any,
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

export type RichtextJSONDocument = NodeType<
  'doc',
  undefined,
  never,
  RichtextElements[]
>;
