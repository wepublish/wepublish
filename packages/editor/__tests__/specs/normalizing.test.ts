import {withReact} from 'slate-react'
import {createEditor, Transforms, Element as SlateElement} from 'slate'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {withNormalizeNode} from '../../src/client/blocks/richTextBlock/editor/normalizing'
import {pTest} from '../utils'
import {
  emptyTextParagraph,
  emptyCellsTable
} from '../../src/client/blocks/richTextBlock/editor/elements'

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
