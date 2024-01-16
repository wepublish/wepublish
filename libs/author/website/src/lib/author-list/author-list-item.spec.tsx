import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './author-list-item.stories'

describe('AuthorList Item', () => {
  runStorybookTests(stories)
})
