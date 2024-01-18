import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './page.stories'

describe('Page', () => {
  runStorybookTests(stories)
})
