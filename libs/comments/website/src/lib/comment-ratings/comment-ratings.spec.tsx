import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './comment-ratings.stories'

describe('CommentRatings', () => {
  runStorybookTests(stories)
})
