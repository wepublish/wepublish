import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './page-container.stories'

describe('Page Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
