import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './subscribe-container.stories'

describe('Subscribe Container', () => {
  beforeAll(() => {
    Object.defineProperty(global.window, 'location', {
      value: {
        href: 'http://localhost'
      }
    })
  })

  runStorybookContainerTests(stories)
})
