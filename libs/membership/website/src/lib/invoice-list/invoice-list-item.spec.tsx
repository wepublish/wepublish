import {runStorybookTests} from '@wepublish/testing'
import * as stories from './invoice-list-item.stories'

describe('Invoice Item', () => {
  runStorybookTests(stories)
})
