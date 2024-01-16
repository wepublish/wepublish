import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './login-form-container.stories'

describe('Login Form Container', () => {
  runStorybookContainerTests(stories, 'WithEmail')
})
