import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './comment-list.stories'

// Excluded because of a bug. See more here https://github.com/storybookjs/storybook/issues/23410
const {AnonymousCommentingOpen, CommentingOpen, ...filteredStories} = stories

describe('Comment List', () => {
  runStorybookTests(filteredStories)
})
