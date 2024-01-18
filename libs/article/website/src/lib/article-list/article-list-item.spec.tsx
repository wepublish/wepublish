import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './article-list-item.stories'

describe('ArticleList Item', () => {
  runStorybookTests(stories)
})
