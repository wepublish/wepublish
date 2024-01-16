import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './title-block.stories'

describe('Title Block', () => {
  runStorybookTests(stories)
})
