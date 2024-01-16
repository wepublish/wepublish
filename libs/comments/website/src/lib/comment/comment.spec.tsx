import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './comment.stories'

describe('Comment', () => {
  runStorybookTests(stories)
})
