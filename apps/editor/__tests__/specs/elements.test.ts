import {emptyCellsTable} from '@wepublish/ui/editor'

describe('emptyCellsTable', () => {
  test.each([emptyCellsTable(1, 1), emptyCellsTable(2, 2)])(
    'should match snapshot %p',
    createTable => {
      expect(createTable).toMatchSnapshot()
    }
  )
})
