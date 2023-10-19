import {runStorybookTests} from '@wepublish/testing'
import * as stories from './comment-ratings.stories'

describe('CommentRatings', () => {
  runStorybookTests(stories)
})
