// It is unpleasant to test data structures in the browser and there is not yet testing
// utilities provided by Slatejs.org. The following procedure allows for testing the normalizing,
// i.e. the schema validation.

import {withReact} from 'slate-react'
import {createEditor, Transforms, Element as SlateElement} from 'slate'
import {allNodes} from '../../src/client/blocks/richTextBlock/editor/utils'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {withNormTables} from '../../src/client/blocks/richTextBlock/editor/normalizing'

const emptyTextParagraph = () => ({type: BlockFormat.Paragraph, children: [{text: ''}]})

const emptyCellsTable = (nrows: number, ncols: number): SlateElement[] => [
  {
    type: BlockFormat.Table,
    children: Array.from({length: nrows}).map(() => ({
      type: BlockFormat.TableRow,
      children: Array.from({length: ncols}).map(() => ({
        type: BlockFormat.TableCell,
        borderColor: 'black',
        // Wrap all content inside cell into paragraph block to enable break lines.
        children: [emptyTextParagraph()]
      }))
    }))
  }
  // Append empty paragraph after table block for easy continuation.
  // emptyTextParagraph() TODO
]

const invalidTable: SlateElement[] = [
  {
    type: BlockFormat.Table,
    children: [emptyTextParagraph()]
  }
]

describe('test', () => {
  const editor = withNormTables(withReact(createEditor()))
  Transforms.insertNodes(editor, invalidTable)
  it('should ', () => {
    expect(allNodes(editor)).toEqual(emptyCellsTable(1, 1))
  })
})
