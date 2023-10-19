import {runStorybookTests} from '@wepublish/testing'
import * as stories from './author-list-item.stories'

describe('AuthorList Item', () => {
  runStorybookTests(stories)
})
