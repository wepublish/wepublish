import {runStorybookTests} from '@wepublish/testing'
import * as stories from './rating.stories'

describe('Rating', () => {
  runStorybookTests(stories)
})
