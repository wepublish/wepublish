import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './invoice-list-item.stories'

describe('Invoice Item', () => {
  runStorybookTests(stories)
})
