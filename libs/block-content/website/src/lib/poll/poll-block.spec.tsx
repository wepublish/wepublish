import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './poll-block.stories'

describe('Poll Block', () => {
  runStorybookTests(stories)
})
