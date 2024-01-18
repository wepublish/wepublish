import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './author-container.stories'

describe('Author Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
