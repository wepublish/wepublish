import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './rating.stories'

describe('Rating', () => {
  runStorybookTests(stories)
})
