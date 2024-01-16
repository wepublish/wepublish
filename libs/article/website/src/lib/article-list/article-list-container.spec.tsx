import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './article-list-container.stories'

describe('AuthorList Container', () => {
  runStorybookContainerTests(stories)
})
