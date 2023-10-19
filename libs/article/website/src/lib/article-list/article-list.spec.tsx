import {runStorybookTests} from '@wepublish/testing'
import * as stories from './article-list.stories'

describe('ArticleList', () => {
  runStorybookTests(stories)
})
