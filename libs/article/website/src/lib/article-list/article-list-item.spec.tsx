import {runStorybookTests} from '@wepublish/testing'
import * as stories from './article-list-item.stories'

describe('ArticleList Item', () => {
  runStorybookTests(stories)
})
