import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './registration-form-container.stories'

describe('Registration Form Container', () => {
  runStorybookContainerTests(stories, 'Filled')
})
