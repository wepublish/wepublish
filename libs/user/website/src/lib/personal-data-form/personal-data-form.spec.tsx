import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './personal-data-form.stories'

describe('Registration Form', () => {
  runStorybookTests(stories)
})
