import {runStorybookTests} from '@wepublish/testing'
import * as stories from './comment-list-item.stories'

// Excluded because of a bug. See more here https://github.com/storybookjs/storybook/issues/23410
const {CommentingWithError, EditingWithError, ...filteredStories} = stories

describe('Comment List Item', () => {
  runStorybookTests(filteredStories)
})
