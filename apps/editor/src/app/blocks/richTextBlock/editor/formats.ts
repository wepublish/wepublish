export enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell'
}

export enum InlineFormat {
  Link = 'link'
}

export enum TextFormat {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript'
}

export type Format = BlockFormat | InlineFormat | TextFormat

export const BlockFormats: string[] = Object.values(BlockFormat)
export const InlineFormats: string[] = Object.values(InlineFormat)
export const TextFormats: string[] = Object.values(TextFormat)
export const ListFormats: string[] = [BlockFormat.UnorderedList, BlockFormat.OrderedList]
