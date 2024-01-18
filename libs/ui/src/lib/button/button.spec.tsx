import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './button.stories'

describe('Button', () => {
  runStorybookTests(stories)
})
