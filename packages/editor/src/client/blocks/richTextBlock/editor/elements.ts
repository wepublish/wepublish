import {BlockFormat} from './formats'
import {Element as SlateElement} from 'slate'

export function emptyTextParagraph(): SlateElement {
  return {type: BlockFormat.Paragraph, children: [{text: ''}]}
}

export function emptyCellsTable(nrows: number, ncols: number): SlateElement[] {
  return [
    {
      type: BlockFormat.Table,
      children: Array.from({length: nrows}).map(() => ({
        type: BlockFormat.TableRow,
        children: Array.from({length: ncols}).map(() => ({
          type: BlockFormat.TableCell,
          borderColor: 'black',
          //     // Wrap all content inside cell into paragraph block to enable break lines.
          children: [emptyTextParagraph()]
        }))
      }))
    },
    // Append empty paragraph after table block for easy continuation.
    emptyTextParagraph()
  ]
}
