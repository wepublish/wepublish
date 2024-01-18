import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './author.stories'

describe('Author', () => {
  runStorybookTests(stories)
})
