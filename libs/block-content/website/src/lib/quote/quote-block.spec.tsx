import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './quote-block.stories'

describe('Quote Block', () => {
  runStorybookTests(stories)
})
