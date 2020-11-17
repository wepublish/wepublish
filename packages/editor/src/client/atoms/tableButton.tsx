import React, {ButtonHTMLAttributes} from 'react'
import {ToolbarButtonProps, ToolbarButton} from '../atoms/toolbar'
import {useSlate} from 'slate-react'

import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

/* ************************TODO finally move this part backto richTextBlock
 *  and pass children with props={onActivate, onDeactivae} to the MainButton
 */

enum BlockFormat {
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

enum InlineFormat {
  Link = 'link'
}

enum TextFormat {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript'
}

type Format = BlockFormat | InlineFormat | TextFormat

export interface EmojiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: IconNames | SVGIcon
  readonly iconActive?: IconNames | SVGIcon
  readonly active?: boolean
}

interface SlateBlockButtonProps extends ToolbarButtonProps {
  readonly format: Format
}

export function TableButton({icon}: SlateBlockButtonProps) {
  /**
   * on activate table > all text into 1-col-table (similar to ol/ul)
   * if blockformat.table > table controls show [+row, +col, X]
   **/
  const editor = useSlate()

  const btn = (onMouseDown: () => any) => (
    <ToolbarButton
      icon={icon}
      active={false}
      onMouseDown={e => {
        e.preventDefault()
        editor.insertBreak()
        onMouseDown()
      }}
    />
  )

  return btn(() => {
    editor.insertFragment([
      {
        children: [
          {
            text: 'TODO: senseful table insert handling, and add border styling buttons.'
          }
        ]
      },
      {
        type: 'table',
        children: [
          {
            type: 'table-row',
            children: [
              {
                type: 'table-cell',
                children: [{text: ''}]
              },
              {
                type: 'table-cell',
                children: [{text: 'Human', bold: true}]
              },
              {
                type: 'table-cell',
                children: [{text: 'Dog', bold: true}]
              },
              {
                type: 'table-cell',
                children: [{text: 'Cat', bold: true}]
              }
            ]
          },
          {
            type: 'table-row',
            children: [
              {
                type: 'table-cell',
                children: [{text: '# of Feet', bold: true}]
              },
              {
                type: 'table-cell',
                children: [{text: '2'}]
              },
              {
                type: 'table-cell',
                children: [{text: '4'}]
              },
              {
                type: 'table-cell',
                children: [{text: '4'}]
              }
            ]
          },
          {
            type: 'table-row',
            children: [
              {
                type: 'table-cell',
                children: [{text: '# of Lives', bold: true}]
              },
              {
                type: 'table-cell',
                children: [{text: '1'}]
              },
              {
                type: 'table-cell',
                children: [{text: '1'}]
              },
              {
                type: 'table-cell',
                children: [{text: '9'}]
              }
            ]
          }
        ]
      }
    ])
  })
}
