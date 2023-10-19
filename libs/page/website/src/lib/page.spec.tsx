import {runStorybookTests} from '@wepublish/testing'
import * as stories from './page.stories'

describe('Page', () => {
  runStorybookTests(stories)
})
