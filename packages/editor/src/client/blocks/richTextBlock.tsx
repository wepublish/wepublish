import React from 'react'

import {Value, Editor, SchemaProperties} from 'slate'
import {RenderMarkProps, RenderInlineProps, RenderBlockProps, Plugin} from 'slate-react'

import {
  MaterialIconFormatBold,
  MaterialIconFormatItalic,
  MaterialIconFormatUnderlined,
  MaterialIconFormatStrikethrough,
  MaterialIconLooksTwoOutlined,
  MaterialIconLooks3Outlined,
  MaterialIconFormatListBulleted,
  MaterialIconFormatListNumbered,
  MaterialIconLink
} from '@karma.run/icons'

import {RichTextField, RichTextFieldProps, Typography, RichTextMenuPlugin} from '@karma.run/ui'

enum BlockType {
  Heading2 = 'heading-two',
  Heading3 = 'heading-three',
  Paragraph = 'paragraph',
  BulletedList = 'bulleted-list',
  NumberedList = 'numbered-list',
  ListItem = 'list-item'
}

enum InlineType {
  Link = 'link'
}

enum MarkType {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough'
}

const DEFAULT_NODE = 'paragraph'

function renderMark(props: RenderMarkProps, editor: Editor, next: () => any) {
  const {children, mark, attributes} = props

  switch (mark.type) {
    case MarkType.Bold:
      return <strong {...attributes}>{children}</strong>

    case MarkType.Italic:
      return <em {...attributes}>{children}</em>

    case MarkType.Underline:
      return <u {...attributes}>{children}</u>

    case MarkType.Strikethrough:
      return <del {...attributes}>{children}</del>

    default:
      return next()
  }
}

function renderBlock(
  {children, node, attributes}: RenderBlockProps,
  editor: Editor,
  next: () => any
) {
  switch (node.type) {
    case BlockType.Heading2:
      return (
        <Typography variant="h2" spacing="small" {...attributes}>
          {children}
        </Typography>
      )
    case BlockType.Heading3:
      return (
        <Typography variant="h3" spacing="small" {...attributes}>
          {children}
        </Typography>
      )
    case BlockType.Paragraph:
      return (
        <Typography variant="body1" spacing="large" {...attributes}>
          {children}
        </Typography>
      )
    case BlockType.BulletedList:
      return <ul {...attributes}>{children}</ul>

    case BlockType.NumberedList:
      return <ol {...attributes}>{children}</ol>

    case BlockType.ListItem:
      return <li {...attributes}>{children}</li>

    default:
      return next()
  }
}

function renderInline(
  {children, node, attributes}: RenderInlineProps,
  editor: Editor,
  next: () => any
) {
  switch (node.type) {
    case InlineType.Link:
      return <a {...attributes}>{children}</a>

    default:
      return next()
  }
}

function hasMark(editor: Editor, value: Value, label: string) {
  return value.activeMarks.some(mark => mark!.type === label)
}

function hasType(editor: Editor, value: Value, label: string) {
  return hasBlock(value, label)
}

function hasBlock(value: Value, label: string) {
  return value.blocks.some(block => {
    return block!.type === label
  })
}

function hasInlines(editor: Editor, value: Value, label: string) {
  return value.inlines.some(inline => inline!.type === label)
}

function isListOfType(editor: Editor, val: Value, label: string) {
  const {blocks} = val
  const first = blocks.first()
  const isListItem = blocks.some(blocks => blocks!.type === BlockType.ListItem)

  return editor.value.blocks.some(() => {
    if (isListItem) {
      const parent = val.document.getClosest(
        first.key,
        parent => parent.object == 'block' && parent.type == label
      )

      return parent != undefined
    }

    return false
  })
}

function toggleMark(editor: Editor, value: Value, label: string) {
  editor.toggleMark(label)
}

function toggleTitle(editor: Editor, value: Value, isH2: boolean) {
  const type = isH2 ? BlockType.Heading2 : BlockType.Heading3
  const isActive = hasBlock(value, type)
  const isList = hasBlock(value, BlockType.ListItem)

  if (isList) {
    editor
      .setBlocks(isActive ? DEFAULT_NODE : type)
      .unwrapBlock(BlockType.BulletedList)
      .unwrapBlock(BlockType.NumberedList)
  } else {
    editor.setBlocks(isActive ? DEFAULT_NODE : type)
  }
}

function toggleList(editor: Editor, value: Value, listType: string) {
  const isList = hasBlock(value, BlockType.ListItem)
  const isType = value.blocks.some(block => {
    return !!value.document.getClosest(
      block!.key,
      parent => parent.object == 'block' && parent.type === listType
    )
  })

  if (isList && isType) {
    editor
      .setBlocks(DEFAULT_NODE)
      .unwrapBlock(BlockType.BulletedList)
      .unwrapBlock(BlockType.NumberedList)
  } else if (isList) {
    editor
      .unwrapBlock(
        listType === BlockType.BulletedList ? BlockType.NumberedList : BlockType.BulletedList
      )
      .wrapBlock(listType)
  } else {
    editor.setBlocks(BlockType.ListItem).wrapBlock(listType)
  }
}

const standardRichTextEditItems = [
  {
    icon: MaterialIconFormatBold,
    label: MarkType.Bold,
    onApply: toggleMark,
    isActive: hasMark
  },
  {
    icon: MaterialIconFormatItalic,
    label: MarkType.Italic,
    onApply: toggleMark,
    isActive: hasMark
  },
  {
    icon: MaterialIconFormatUnderlined,
    label: MarkType.Underline,
    onApply: toggleMark,
    isActive: hasMark
  },
  {
    icon: MaterialIconFormatStrikethrough,
    label: MarkType.Strikethrough,
    onApply: toggleMark,
    isActive: hasMark
  },
  {
    icon: MaterialIconLooksTwoOutlined,
    label: BlockType.Heading2,
    onApply: (editor: Editor, value: Value) => toggleTitle(editor, value, true),
    isActive: hasType
  },
  {
    icon: MaterialIconLooks3Outlined,
    label: BlockType.Heading3,
    onApply: (editor: Editor, value: Value) => toggleTitle(editor, value, false),
    isActive: hasType
  },
  {
    icon: MaterialIconFormatListBulleted,
    label: BlockType.BulletedList,
    onApply: (editor: Editor, value: Value) => toggleList(editor, value, BlockType.BulletedList),
    isActive: isListOfType
  },
  {
    icon: MaterialIconFormatListNumbered,
    label: BlockType.NumberedList,
    onApply: (editor: Editor, value: Value) => toggleList(editor, value, BlockType.NumberedList),
    isActive: isListOfType
  },
  {
    icon: MaterialIconLink,
    label: InlineType.Link,
    onApply: (editor: Editor, value: Value) => {},
    isActive: hasInlines
  }
]

const plugins: Plugin[] = [
  RichTextMenuPlugin(standardRichTextEditItems),
  {renderBlock, renderInline, renderMark}
]

const schema: SchemaProperties = {
  document: {
    nodes: [
      {
        match: [
          {type: BlockType.Heading2},
          {type: BlockType.Heading3},
          {type: BlockType.Paragraph},
          {type: BlockType.BulletedList},
          {type: BlockType.NumberedList},
          {type: BlockType.ListItem}
        ]
      }
    ],
    normalize: (editor, error) => {
      console.log(error)
      if (error.code === 'child_type_invalid') {
        editor.setNodeByKey(error.child.key, {type: BlockType.Paragraph})
      }
    }
  }

  // TODO: Block validation?
  // blocks: {
  //   [BlockType.BulletedList]: {
  //     nodes: [{match: {type: BlockType.ListItem}}]
  //   },
  //   [BlockType.NumberedList]: {
  //     nodes: [{match: {type: BlockType.ListItem}}]
  //   },
  //   [BlockType.ListItem]: {
  //     parent: [{type: BlockType.BulletedList}, {type: BlockType.NumberedList}]
  //   }
  // }
}

export function RichTextBlock(props: RichTextFieldProps) {
  return <RichTextField {...props} plugins={plugins} schema={schema}></RichTextField>
}
