import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './article-container.stories'

describe('Article Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
