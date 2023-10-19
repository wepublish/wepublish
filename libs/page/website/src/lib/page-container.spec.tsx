import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './page-container.stories'

describe('Page Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
