import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './author-list.stories'

describe('AuthorList', () => {
  runStorybookTests(stories)
})
