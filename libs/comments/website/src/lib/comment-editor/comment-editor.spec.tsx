import {runStorybookTests} from '@wepublish/testing'
import * as stories from './comment-editor.stories'

describe('CommentEditor', () => {
  runStorybookTests(stories)
})
