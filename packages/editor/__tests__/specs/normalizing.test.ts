import {withReact} from 'slate-react'
import {createEditor, Transforms, Element as SlateElement} from 'slate'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {withNormalizeNode} from '../../src/client/blocks/richTextBlock/editor/normalizing'
import {pTest} from '../utils'
import {
  emptyTextParagraph,
  emptyCellsTable,
  defaultBorderColor
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
      name: 'should return unmodified data, given simple valid table',
      entryData: emptyCellsTable(1, 1),
      normalizedData: emptyCellsTable(1, 1)
    },
    {
      name: 'should return unmodified data, given valid multiple cells table',
      entryData: emptyCellsTable(33, 97), // TODO choose meaningful
      normalizedData: emptyCellsTable(33, 97)
    },
    {
      name: 'should return fixed table given a nakedTableRow',
      entryData: [
        {
          type: BlockFormat.TableRow,
          children: [emptyTextParagraph()]
        }
      ],
      normalizedData: emptyCellsTable(1, 1)
    },
    {
      name: 'should return merged fixed tables given multiple invalid table parts',
      entryData: [
        {
          type: BlockFormat.Table,
          children: [emptyTextParagraph()]
        },
        {
          type: BlockFormat.TableCell,
          borderColor: defaultBorderColor,
          children: [emptyTextParagraph()]
        }
      ],
      normalizedData: emptyCellsTable(2, 1)
    },
    {
      name: 'should add borderColor to tableCell if missing',
      entryData: [
        {
          type: BlockFormat.Table,
          children: [
            {
              type: BlockFormat.TableRow,
              children: [
                {
                  type: BlockFormat.TableCell,
                  // borderColor: defaultBorderColor, TO BE FIXED
                  children: [emptyTextParagraph()]
                }
              ]
            }
          ]
        },
        emptyTextParagraph()
      ],
      normalizedData: emptyCellsTable(1, 1)
    }
  ],
  (t: WithNormalizeNodeTest) => {
    const editor = withNormalizeNode(withReact(createEditor()))
    Transforms.insertNodes(editor, t.entryData)
    expect(editor.children).toEqual(t.normalizedData)
  }
)
