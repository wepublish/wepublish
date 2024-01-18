import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './article.stories'

describe('Article', () => {
  runStorybookTests(stories)
})
