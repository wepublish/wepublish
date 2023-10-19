import {runStorybookTests} from '@wepublish/testing'
import * as stories from './title-block.stories'

describe('Title Block', () => {
  runStorybookTests(stories)
})
