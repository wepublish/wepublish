import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './comment-list-container.stories'

describe('CommentList Container', () => {
  runStorybookContainerTests(stories)
})
