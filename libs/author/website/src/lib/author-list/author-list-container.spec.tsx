import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './author-list-container.stories'

describe('AuthorList Container', () => {
  runStorybookContainerTests(stories)
})
