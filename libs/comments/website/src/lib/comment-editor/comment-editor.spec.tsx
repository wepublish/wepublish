import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './comment-editor.stories'

describe('CommentEditor', () => {
  runStorybookTests(stories)
})
