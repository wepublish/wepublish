import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './peer-information.stories'

describe('PeerInformation', () => {
  runStorybookTests(stories)
})
