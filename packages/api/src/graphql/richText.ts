import {GraphQLScalarType, valueFromASTUntyped} from 'graphql'
import {isObject, isString, isArray, isBoolean} from '@karma.run/utility'

export enum ElementNodeType {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  Link = 'link'
}

export enum TextNodeFields {
  Text = 'text',
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript'
}

export enum ElementNodeFields {
  Type = 'type',
  Children = 'children'
}

export enum LinkNodeFields {
  URL = 'url',
  Title = 'title'
}

export interface RichTextBlockNode {
  readonly type:
    | ElementNodeType.H1
    | ElementNodeType.H2
    | ElementNodeType.H3
    | ElementNodeType.Paragraph
    | ElementNodeType.UnorderedList
    | ElementNodeType.OrderedList
    | ElementNodeType.ListItem
  readonly children: RichTextNode[]
}

export interface RichTextLinkNode {
  readonly type: ElementNodeType.Link
  readonly url: string
  readonly title?: string
  readonly children: RichTextNode[]
}

export interface RichTextTextNode {
  readonly bold?: boolean
  readonly italic?: boolean
  readonly underline?: boolean
  readonly strikethrough?: boolean
  readonly superscript?: boolean
  readonly subscript?: boolean
  readonly text: string
}

export type RichTextNode = RichTextBlockNode | RichTextLinkNode | RichTextTextNode

export const GraphQLRichText = new GraphQLScalarType({
  name: 'RichText',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return parseRichTextNodes(value)
  },

  parseLiteral(literal) {
    return parseRichTextNodes(valueFromASTUntyped(literal))
  }
})

export function createRichTextError(message: string, path: string[]) {
  return new Error(path.length > 0 ? `Error at path "${path.join('.')}": ${message}` : message)
}

const TextNodeFieldsArr: string[] = Object.values(TextNodeFields)
const ElmentNodeFieldsArr: string[] = Object.values(ElementNodeFields)

const LinkNodeFieldsArr: string[] = [
  ...Object.values(ElementNodeFields),
  ...Object.values(LinkNodeFields)
]

const ElementNodeTypeArr: string[] = Object.values(ElementNodeType)

export function parseRichTextNode(value: unknown, path: string[] = []): RichTextNode {
  if (!isObject(value)) {
    throw createRichTextError(`Expected object, found ${value}.`, path)
  }

  const isTextNode = value.text !== undefined
  const isElementNode = value.children !== undefined

  if (isTextNode && isElementNode) {
    throw createRichTextError(`Field "text" and "children" are mutually exclusive.`, path)
  }

  if (isTextNode) {
    for (const field of Object.keys(value)) {
      if (!TextNodeFieldsArr.includes(field)) {
        throw createRichTextError(`Unknown TextNode field "${field}".`, path)
      }
    }

    if (!isString(value.text)) {
      throw createRichTextError(`Expected string found ${value.text}`, [...path, 'text'])
    }

    if (value.bold !== undefined && !isBoolean(value.bold)) {
      throw createRichTextError(`Expected boolean found ${value.bold}`, [...path, 'bold'])
    }

    if (value.italic !== undefined && !isBoolean(value.italic)) {
      throw createRichTextError(`Expected boolean found ${value.italic}`, [...path, 'italic'])
    }

    if (value.underline !== undefined && !isBoolean(value.underline)) {
      throw createRichTextError(`Expected boolean found ${value.underline}`, [...path, 'underline'])
    }

    if (value.strikethrough !== undefined && !isBoolean(value.strikethrough)) {
      throw createRichTextError(`Expected boolean found ${value.strikethrough}`, [
        ...path,
        'strikethrough'
      ])
    }

    if (value.superscript !== undefined && !isBoolean(value.superscript)) {
      throw createRichTextError(`Expected boolean found ${value.superscript}`, [
        ...path,
        'superscript'
      ])
    }

    if (value.subscript !== undefined && !isBoolean(value.subscript)) {
      throw createRichTextError(`Expected boolean found ${value.subscript}`, [...path, 'subscript'])
    }

    return Object.assign(
      {text: value.text},
      value.bold !== undefined ? {bold: value.bold as boolean} : {},
      value.italic !== undefined ? {italic: value.italic as boolean} : {},
      value.underline !== undefined ? {underline: value.underline as boolean} : {},
      value.strikethrough !== undefined ? {strikethrough: value.strikethrough as boolean} : {},
      value.superscript !== undefined ? {superscript: value.superscript as boolean} : {},
      value.subscript !== undefined ? {subscript: value.subscript as boolean} : {}
    )
  } else {
    const isLinkNode = value.type === ElementNodeType.Link

    for (const field of Object.keys(value)) {
      if (isLinkNode) {
        if (!LinkNodeFieldsArr.includes(field)) {
          throw createRichTextError(`Unknown LinkNode field "${field}".`, path)
        }
      } else {
        if (!ElmentNodeFieldsArr.includes(field)) {
          throw createRichTextError(`Unknown ElementNode field "${field}".`, path)
        }
      }
    }

    if (!isArray(value.children)) {
      throw createRichTextError(`Expected array found ${value.children}`, [...path, 'children'])
    }

    if (!isString(value.type) || !ElementNodeTypeArr.includes(value.type)) {
      throw createRichTextError(
        `Expected one of ${JSON.stringify(ElementNodeTypeArr)} found ${value.type}`,
        [...path, 'type']
      )
    }

    const type = value.type as ElementNodeType

    switch (type) {
      case ElementNodeType.Link: {
        if (!isString(value.url)) {
          // TODO: Check URL for malicious content.
          throw createRichTextError(`Expected string found ${value.url}`, [...path, 'url'])
        }

        if (value.title !== undefined && !isString(value.title)) {
          throw createRichTextError(`Expected string found ${value.title}`, [...path, 'title'])
        }

        return Object.assign(
          {
            type,
            url: value.url,
            children: parseRichTextNodes(value.children, [...path, 'children'])
          },
          value.title !== undefined ? {title: value.title as string} : {}
        )
      }

      default:
        return {
          type,
          children: parseRichTextNodes(value.children, [...path, 'children'])
        }
    }
  }
}

export function parseRichTextNodes(value: unknown, path: string[] = []): RichTextNode[] {
  if (!Array.isArray(value)) {
    throw createRichTextError(`Expected array, found ${typeof value}.`, path)
  }

  return value.map((value, index) => parseRichTextNode(value, [...path, index.toString()]))
}
