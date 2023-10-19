import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './author-list-container.stories'

describe('AuthorList Container', () => {
  runStorybookContainerTests(stories)
})
