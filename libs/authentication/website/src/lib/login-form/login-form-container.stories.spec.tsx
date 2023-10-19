import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './login-form-container.stories'

describe('Login Form Container', () => {
  runStorybookContainerTests(stories, 'WithEmail')
})
