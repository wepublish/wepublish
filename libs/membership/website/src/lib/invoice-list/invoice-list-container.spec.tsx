import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './invoice-list-container.stories'

describe('InvoiceList Container', () => {
  beforeAll(() => {
    Object.defineProperty(global.window, 'location', {
      value: {
        href: 'http://localhost'
      }
    })
  })

  runStorybookContainerTests(stories)
})
