import {withReact} from 'slate-react'
import {createEditor, Transforms, Element as SlateElement} from 'slate'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {withNormalizeNode} from '../../src/client/blocks/richTextBlock/editor/normalizing'
import {pTest} from '../utils'
import {
  emptyTextParagraph,
  emptyCellsTable
} from '../../src/client/blocks/richTextBlock/editor/elements'

interface WithNormalizeNodeTest {
  name: string
  entryData: SlateElement[]
  normalizedData: SlateElement[]
}

pTest(
  'withNormalizeNode',
  [
    {
      name: 'should return unmodified valid simple data',
      entryData: emptyCellsTable(1, 1),
      normalizedData: emptyCellsTable(1, 1)
    },
    {
      name: 'should return unmodified valid deeply nested data',
      entryData: emptyCellsTable(33, 97), // TODO choose meaningful
      normalizedData: emptyCellsTable(33, 97)
    },
    {
      name: 'should return valid table given a nakedTableRow',
      entryData: [
        {
          type: BlockFormat.TableRow,
          children: [emptyTextParagraph()]
        }
      ],
      normalizedData: emptyCellsTable(1, 1)
    },
    {
      name: 'should return fixed tables given multiple invalid table parts',
      entryData: [
        {
          type: BlockFormat.Table,
          children: [emptyTextParagraph()]
        },
        {
          type: BlockFormat.TableCell,
          borderColor: 'black',
          children: [emptyTextParagraph()]
        }
      ],
      normalizedData: [...emptyCellsTable(1, 1), ...emptyCellsTable(1, 1)]
    }
  ],
  (t: WithNormalizeNodeTest) => {
    const editor = withNormalizeNode(withReact(createEditor()))
    Transforms.insertNodes(editor, t.entryData)
    expect(editor.children).toEqual(t.normalizedData)
  }
)
