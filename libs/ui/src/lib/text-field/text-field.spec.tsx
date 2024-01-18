import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './text-field.stories'

describe('TextField', () => {
  runStorybookTests(stories)
})
