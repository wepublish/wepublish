import * as stories from './blocks.stories'
import {runStorybookTests} from '@wepublish/testing'

describe('Blocks', () => {
  runStorybookTests(stories)
})
