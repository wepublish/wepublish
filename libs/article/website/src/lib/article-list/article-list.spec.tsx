import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './article-list.stories'

describe('ArticleList', () => {
  runStorybookTests(stories)
})
