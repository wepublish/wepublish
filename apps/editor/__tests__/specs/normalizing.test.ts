import {
  BlockFormat,
  DEFAULT_BORDER_COLOR,
  emptyCellsTable,
  emptyTextParagraph,
  withNormalizeNode
} from '@wepublish/ui/editor'
import {createEditor, Transforms} from 'slate'
import {withReact} from 'slate-react'

describe('withNormalizeNode', () => {
  test.each([
    {
      name: 'should return unmodified data, given simple valid table',
      entryData: emptyCellsTable(1, 1)
    },
    {
      name: 'should return unmodified data, given valid multiple cells table',
      entryData: emptyCellsTable(33, 97) // TODO choose meaningful
    },
    {
      name: 'should return fixed table given a nakedTableRow',
      entryData: [
        {
          type: BlockFormat.TableRow,
          children: [emptyTextParagraph()]
        }
      ]
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
          borderColor: DEFAULT_BORDER_COLOR,
          children: [emptyTextParagraph()]
        }
      ]
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
                  // borderColor: DEFAULT_BORDER_COLOR, TO BE FIXED
                  children: [emptyTextParagraph()]
                }
              ]
            }
          ]
        },
        emptyTextParagraph()
      ]
    }
  ])('should match snapshot for %p', ({entryData}) => {
    const editor = withNormalizeNode(withReact(createEditor()))
    Transforms.insertNodes(editor, entryData)
    expect(editor.children).toMatchSnapshot()
  })
})
