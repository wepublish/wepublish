import {BlockFormat} from './formats'
import {Element as SlateElement} from 'slate'

export function emptyTextParagraph(): SlateElement {
  return {type: BlockFormat.Paragraph, children: [{text: ''}]}
}

export interface TableCell extends SlateElement {
  type: BlockFormat.TableCell
  borderColor: string
}

export const defaultBorderColor: TableCell['borderColor'] = '#000000'

export function emptyCellsTable(nrows: number, ncols: number): SlateElement[] {
  return [
    {
      type: BlockFormat.Table,
      children: Array.from({length: nrows}).map(() => ({
        type: BlockFormat.TableRow,
        children: Array.from({length: ncols}).map(
          (): TableCell => ({
            type: BlockFormat.TableCell,
            borderColor: defaultBorderColor,
            //     // Wrap all content inside cell into paragraph block to enable break lines.
            children: [emptyTextParagraph()]
          })
        )
      }))
    },
    // Append empty paragraph after table block for easy continuation.
    emptyTextParagraph()
  ]
}
