import {runStorybookTests} from '@wepublish/testing'
import * as stories from './personal-data-form.stories'

describe('Registration Form', () => {
  runStorybookTests(stories)
})
