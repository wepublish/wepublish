import {withReact} from 'slate-react'
import {createEditor, Transforms, Element as SlateElement} from 'slate'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {withNormalizeNode} from '../../src/client/blocks/richTextBlock/editor/normalizing'
import {pTest} from '../utils'

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
  },
  {
    type: BlockFormat.TableCell,
    borderColor: 'black',
    children: [emptyTextParagraph()]
  }
]

interface WithNormalizeNodeTest {
  name: string
  entryData: SlateElement[]
  normalizedData: SlateElement[]
}

pTest(
  'withNormalizeNode',
  [
    {
      name: 'should return valid data',
      entryData: emptyCellsTable(1, 1),
      normalizedData: emptyCellsTable(1, 1)
    },
    {
      name: 'returns given string its length equals maxLength',
      entryData: invalidTable,
      normalizedData: [...emptyCellsTable(1, 1), ...emptyCellsTable(1, 1)]
    }
  ],
  (t: WithNormalizeNodeTest) => {
    const editor = withNormalizeNode(withReact(createEditor()))
    Transforms.insertNodes(editor, t.entryData)
    expect(editor.children).toEqual(t.normalizedData)
  }
)
