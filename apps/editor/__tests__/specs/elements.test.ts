import {emptyCellsTable} from '../../src/app/blocks/richTextBlock/editor/elements'

describe('emptyCellsTable', () => {
  test.each([emptyCellsTable(1, 1), emptyCellsTable(2, 2)])(
    'should match snapshot %p',
    createTable => {
      expect(createTable).toMatchSnapshot()
    }
  )
})
