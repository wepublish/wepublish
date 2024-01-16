import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './invoice-list.stories'

describe('InvoiceList', () => {
  runStorybookTests(stories)
})
