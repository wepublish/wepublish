import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './login-form.stories'

describe('Login Form', () => {
  runStorybookTests(stories, 'default')
})
