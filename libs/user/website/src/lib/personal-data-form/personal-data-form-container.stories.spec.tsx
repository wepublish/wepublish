import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './personal-data-form-container.stories'

describe('Personal Data Form Container', () => {
  runStorybookContainerTests(stories)
})
