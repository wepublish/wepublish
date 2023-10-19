import {runStorybookTests} from '@wepublish/testing'
import * as stories from './registration-form.stories'

describe('Registration Form', () => {
  runStorybookTests(stories)
})
