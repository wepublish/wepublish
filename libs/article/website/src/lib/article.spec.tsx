import {runStorybookTests} from '@wepublish/testing'
import * as stories from './article.stories'

describe('Article', () => {
  runStorybookTests(stories)
})
