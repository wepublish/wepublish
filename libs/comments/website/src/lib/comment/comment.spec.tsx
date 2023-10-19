import {runStorybookTests} from '@wepublish/testing'
import * as stories from './comment.stories'

describe('Comment', () => {
  runStorybookTests(stories)
})
