import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './comment-list-container.stories'

describe('CommentList Container', () => {
  runStorybookContainerTests(stories)
})
