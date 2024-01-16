import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './comment-block.stories'

describe('Comment List', () => {
  runStorybookTests(stories)
})
