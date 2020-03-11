import {GraphQLScalarType, valueFromASTUntyped} from 'graphql'

export enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item'
}

export enum InlineFormat {
  Link = 'link'
}

export enum TextFormat {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough'
}

export interface RichTextBlockNode {
  readonly type: BlockFormat
  readonly children: RichTextNode[]
}

export interface RichTextLinkNode {
  readonly type: InlineFormat.Link
  readonly url: string
  readonly title?: string
  readonly children: RichTextNode[]
}

export interface RichTextTextNode {
  readonly [TextFormat.Bold]?: boolean
  readonly [TextFormat.Italic]?: boolean
  readonly [TextFormat.Underline]?: boolean
  readonly [TextFormat.Strikethrough]?: boolean
  readonly text: string
}

export type RichTextNode = RichTextBlockNode | RichTextLinkNode | RichTextTextNode

// TODO: Validation / Normalization
export const GraphQLRichText = new GraphQLScalarType({
  name: 'RichText',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return validateRichTextNodes(value)
  },

  parseLiteral(literal) {
    const value: unknown = valueFromASTUntyped(literal)
    return validateRichTextNodes(value)
  }
})

export function validateRichTextNodes(value: unknown): RichTextNode[] {
  if (!Array.isArray(value)) throw new Error()
  return []
}
