import {runStorybookTests} from '@wepublish/testing'
import * as stories from './comment-block.stories'

describe('Comment List', () => {
  runStorybookTests(stories)
})
