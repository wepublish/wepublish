import {runStorybookTests} from '@wepublish/testing'
import * as stories from './login-form.stories'

describe('Login Form', () => {
  runStorybookTests(stories, 'default')
})
