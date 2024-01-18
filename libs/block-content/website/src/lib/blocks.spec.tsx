import * as stories from './blocks.stories'
import {runStorybookTests} from '@wepublish/testing/website'

describe('Blocks', () => {
  runStorybookTests(stories)
})
