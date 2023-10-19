import {runStorybookTests} from '@wepublish/testing'
import * as stories from './button.stories'

describe('Button', () => {
  runStorybookTests(stories)
})
