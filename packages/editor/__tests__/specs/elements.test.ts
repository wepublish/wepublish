import {Element as SlateElement} from 'slate'
import {BlockFormat} from '../../src/client/blocks/richTextBlock/editor/formats'
import {pTest} from '../utils'
import {
  emptyTextParagraph,
  emptyCellsTable,
  defaultBorderColor
} from '../../src/client/blocks/richTextBlock/editor/elements'

interface EmptyCellsTableTest {
  name: string
  createTable: SlateElement[]
  output: SlateElement[]
}

pTest(
  'emptyCellsTable',
  [
    {
      name: 'should return single cell table with subsequent paragraph',
      createTable: emptyCellsTable(1, 1),
      output: [
        {
          type: BlockFormat.Table,
          children: [
            {
              type: BlockFormat.TableRow,
              children: [
                {
                  type: BlockFormat.TableCell,
                  borderColor: defaultBorderColor,
                  children: [emptyTextParagraph()]
                }
              ]
            }
          ]
        },
        emptyTextParagraph()
      ]
    },
    {
      name: 'should return 2 rows with 2 cells each',
      createTable: emptyCellsTable(2, 2),
      output: [
        {
          type: BlockFormat.Table,
          children: [
            {
              type: BlockFormat.TableRow,
              children: [
                {
                  type: BlockFormat.TableCell,
                  borderColor: defaultBorderColor,
                  children: [emptyTextParagraph()]
                },
                {
                  type: BlockFormat.TableCell,
                  borderColor: defaultBorderColor,
                  children: [emptyTextParagraph()]
                }
              ]
            },
            {
              type: BlockFormat.TableRow,
              children: [
                {
                  type: BlockFormat.TableCell,
                  borderColor: defaultBorderColor,
                  children: [emptyTextParagraph()]
                },
                {
                  type: BlockFormat.TableCell,
                  borderColor: defaultBorderColor,
                  children: [emptyTextParagraph()]
                }
              ]
            }
          ]
        },
        emptyTextParagraph()
      ]
    }
  ],
  (t: EmptyCellsTableTest) => {
    expect(t.createTable).toEqual(t.output)
  }
)
