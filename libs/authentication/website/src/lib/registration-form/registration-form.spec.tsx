import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './registration-form.stories'

describe('Registration Form', () => {
  runStorybookTests(stories)
})
