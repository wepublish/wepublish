import {runStorybookTests} from '@wepublish/testing'
import * as stories from './author-list.stories'

describe('AuthorList', () => {
  runStorybookTests(stories)
})
