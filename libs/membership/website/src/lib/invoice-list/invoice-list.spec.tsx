import {runStorybookTests} from '@wepublish/testing'
import * as stories from './invoice-list.stories'

describe('InvoiceList', () => {
  runStorybookTests(stories)
})
